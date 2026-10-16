const { z } = require('zod');
const tasks = require('../controllers/taskController').schemas;
const exams = require('../controllers/examController').schemas;
const subtasks = require('../controllers/subtaskController').schemas;
const users = require('../controllers/userController').schemas;
const chat = require('../controllers/chatController').schemas;
const upload = require('../controllers/uploadController').schemas;
const { parsedExamSchema, weeklyScheduleSchema } = require('./timetableParser');

/**
 * Build the OpenAPI 3.1 document from the same Zod schemas the controllers
 * validate with, so the documentation cannot drift from the implementation.
 */

const toSchema = (schema, io = 'input') => {
  const { $schema: _ignored, ...json } = z.toJSONSchema(schema, { io, unrepresentable: 'any' });
  return json;
};

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] },
    },
  },
});

const jsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema: toSchema(schema) } },
});

const ok = (description, schema = { type: 'object' }) => ({
  description,
  content: { 'application/json': { schema } },
});

const common = {
  400: errorResponse('Validation failed'),
  401: errorResponse('Missing, invalid or expired token'),
  500: errorResponse('Internal server error'),
};
const notFound = { 404: errorResponse('Not found, or owned by another user') };
const aiErrors = {
  429: errorResponse('Per-user AI rate limit reached'),
  502: errorResponse('The AI service failed to respond'),
  503: errorResponse('The AI service is busy or not configured'),
};

const idParam = [
  { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
];

function crud(tag, resource, createSchema, updateSchema) {
  const base = `/${resource}`;
  return {
    [base]: {
      get: {
        tags: [tag],
        summary: `List the user's ${resource}`,
        responses: { 200: ok('List', { type: 'array', items: { type: 'object' } }), ...common },
      },
      post: {
        tags: [tag],
        summary: `Create a ${tag.toLowerCase()}`,
        requestBody: jsonBody(createSchema),
        responses: { 201: ok('Created'), ...common },
      },
    },
    [`${base}/{id}`]: {
      parameters: idParam,
      get: {
        tags: [tag],
        summary: `Get one ${tag.toLowerCase()}`,
        responses: { 200: ok('Found'), ...common, ...notFound },
      },
      patch: {
        tags: [tag],
        summary: `Update a ${tag.toLowerCase()}`,
        requestBody: jsonBody(updateSchema),
        responses: { 200: ok('Updated'), ...common, ...notFound },
      },
      delete: {
        tags: [tag],
        summary: `Delete a ${tag.toLowerCase()}`,
        responses: { 200: ok('Deleted'), ...common, ...notFound },
      },
    },
  };
}

function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Trackit API',
      version: '1.1.0',
      description:
        'REST API for Trackit, the AI-powered student deadline tracker. All endpoints except /health require a Supabase access token. Request schemas are generated from the Zod validators used by the server.',
      license: { name: 'MIT', identifier: 'MIT' },
    },
    servers: [{ url: '/api' }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Supabase JWT' },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Platform'],
          summary: 'Health check',
          security: [],
          responses: { 200: ok('Service is up') },
        },
      },
      ...crud('Task', 'tasks', tasks.createTaskSchema, tasks.updateTaskSchema),
      ...crud('Exam', 'exams', exams.createExamSchema, exams.updateExamSchema),
      '/subtasks': {
        get: {
          tags: ['Subtask'],
          summary: 'List subtasks, optionally for one task or exam',
          parameters: [
            { name: 'task_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'exam_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: ok('List'), ...common },
        },
        post: {
          tags: ['Subtask'],
          summary: 'Create a subtask under an owned task or exam',
          requestBody: jsonBody(subtasks.createSubtaskSchema),
          responses: { 201: ok('Created'), ...common, ...notFound },
        },
      },
      '/subtasks/{id}': {
        parameters: idParam,
        patch: {
          tags: ['Subtask'],
          summary: 'Update a subtask',
          requestBody: jsonBody(subtasks.updateSubtaskSchema),
          responses: { 200: ok('Updated'), ...common, ...notFound },
        },
        delete: {
          tags: ['Subtask'],
          summary: 'Delete a subtask',
          responses: { 200: ok('Deleted'), ...common, ...notFound },
        },
      },
      '/chat': {
        post: {
          tags: ['AI'],
          summary: 'Ask the study assistant, grounded in the user’s tasks and exams',
          requestBody: jsonBody(chat.chatRequestSchema),
          responses: {
            200: ok('Reply', { type: 'object', properties: { reply: { type: 'string' } } }),
            ...common,
            ...aiErrors,
          },
        },
      },
      '/chat/stream': {
        post: {
          tags: ['AI'],
          summary: 'Ask the study assistant and stream the reply as server-sent events',
          description: [
            'Same request as `POST /chat`. The reply arrives as server-sent events:',
            '`delta` with `{ text }` for each fragment, then `done` with `{ reply }` once it',
            'has been saved, or `error` with `{ error }` if the model fails mid-reply.',
            'Failures before the first fragment are JSON error responses.',
          ].join(' '),
          requestBody: jsonBody(chat.chatRequestSchema),
          responses: {
            200: {
              description: 'Event stream',
              content: { 'text/event-stream': { schema: { type: 'string' } } },
            },
            ...common,
            ...aiErrors,
          },
        },
      },
      '/chat/history': {
        get: {
          tags: ['AI'],
          summary: 'Latest 100 chat messages, oldest first',
          responses: { 200: ok('History'), ...common },
        },
        delete: {
          tags: ['AI'],
          summary: 'Clear chat history',
          responses: { 200: ok('Cleared'), ...common },
        },
      },
      '/upload/parse': {
        post: {
          tags: ['AI'],
          summary: 'Extract exams or a weekly schedule from a PDF or image',
          requestBody: jsonBody(upload.parseRequestSchema),
          responses: {
            200: ok('Parsed records', {
              type: 'object',
              properties: {
                type: { enum: ['exam', 'schedule'] },
                data: {
                  oneOf: [
                    { type: 'array', items: toSchema(parsedExamSchema, 'output') },
                    toSchema(weeklyScheduleSchema, 'output'),
                  ],
                },
                warnings: { type: 'array', items: { type: 'string' } },
              },
            }),
            ...common,
            413: errorResponse('File too large'),
            ...aiErrors,
          },
        },
      },
      '/upload/import-exams': {
        post: {
          tags: ['AI'],
          summary: 'Bulk-create reviewed exams',
          requestBody: jsonBody(upload.importExamsSchema),
          responses: { 201: ok('Imported'), ...common },
        },
      },
      '/upload/save-schedule': {
        post: {
          tags: ['AI'],
          summary: 'Save the weekly class schedule',
          requestBody: jsonBody(upload.saveScheduleSchema),
          responses: { 200: ok('Saved'), ...common, ...notFound },
        },
      },
      '/users/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Get (or create) the user profile',
          responses: { 200: ok('Profile'), ...common },
        },
        patch: {
          tags: ['Profile'],
          summary: 'Update profile fields',
          requestBody: jsonBody(users.updateProfileSchema),
          responses: { 200: ok('Profile'), ...common },
        },
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Latest 100 notifications',
          responses: { 200: ok('List'), ...common },
        },
      },
      '/notifications/{id}/read': {
        parameters: idParam,
        patch: {
          tags: ['Notifications'],
          summary: 'Mark one notification as read',
          responses: { 200: ok('Updated'), ...common, ...notFound },
        },
      },
      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          responses: { 200: ok('Updated'), ...common },
        },
      },
      '/notifications/generate-suggestions': {
        post: {
          tags: ['Notifications'],
          summary: 'Create a workload reminder if deadlines are close',
          responses: { 200: ok('Result'), ...common },
        },
      },
      '/analytics/velocity': {
        get: {
          tags: ['Analytics'],
          summary: 'Tasks completed per week, last 4 weeks',
          responses: { 200: ok('Report'), ...common },
        },
      },
      '/analytics/burnout': {
        get: {
          tags: ['Analytics'],
          summary: 'Clusters of 3+ deadlines within 48 hours',
          responses: { 200: ok('Report'), ...common },
        },
      },
    },
  };
}

module.exports = { buildOpenApiDocument };
