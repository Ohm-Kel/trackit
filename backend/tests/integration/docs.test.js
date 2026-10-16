const SwaggerParser = require('@apidevtools/swagger-parser');
const ctx = require('../helpers/app');

describe('API documentation', () => {
  it('serves a valid OpenAPI 3.1 document without authentication', async () => {
    const res = await ctx.api().get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    await expect(SwaggerParser.validate(structuredClone(res.body))).resolves.toBeDefined();
  });

  it('documents request schemas generated from the Zod validators', async () => {
    const { body } = await ctx.api().get('/api/openapi.json');
    const createTask = body.paths['/tasks'].post.requestBody.content['application/json'].schema;
    expect(createTask.required).toEqual(['title']);
    expect(createTask.properties.status.enum).toEqual([
      'not_started',
      'in_progress',
      'stuck',
      'done',
    ]);

    const chat = body.paths['/chat'].post.requestBody.content['application/json'].schema;
    expect(chat.properties.history.items.properties.role.enum).toEqual(['user', 'assistant']);
  });

  it('documents every route the app serves', async () => {
    const { body } = await ctx.api().get('/api/openapi.json');
    for (const path of [
      '/tasks/{id}',
      '/exams/{id}',
      '/subtasks/{id}',
      '/upload/parse',
      '/chat/stream',
      '/analytics/burnout',
      '/calendar/feed',
      '/calendar/export.ics',
      '/calendar/{token}.ics',
    ]) {
      expect(body.paths).toHaveProperty([path]);
    }
  });

  it('serves Swagger UI with a page-specific CSP that allows only the pinned CDN', async () => {
    const res = await ctx.api().get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui-dist@');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("script-src 'self' https://cdn.jsdelivr.net 'sha256-");
    expect(csp).not.toContain("script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'");
  });
});
