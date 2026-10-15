const crypto = require('crypto');
const { z } = require('zod');
const { HttpError } = require('../lib/errors');
const { validate } = require('../lib/validate');
const { recordFailure } = require('../lib/authFailures');
const { buildCalendar } = require('../lib/calendar');
const { createAnonClient } = require('../supabaseUserClient');

// 32 random bytes (256 bits), base64url-encoded without padding: 43 characters.
const TOKEN_BYTES = 32;

const feedParamsSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Invalid calendar token'),
});

const exportQuerySchema = z.object({
  include: z.enum(['all', 'tasks', 'exams']).default('all'),
});

/** Only this hash is stored; see supabase_migrations_003.sql. */
const hashToken = (token) => crypto.createHash('sha256').update(token, 'utf8').digest('hex');

/** Feed path relative to the API base, e.g. /calendar/<token>.ics. */
const feedPath = (token) => `/calendar/${token}.ics`;

function sendCalendar(res, body, { filename, attachment, cacheControl }) {
  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `${attachment ? 'attachment' : 'inline'}; filename="${filename}"`,
    'Cache-Control': cacheControl,
    // The URL is a secret: keep it out of search indexes.
    'X-Robots-Tag': 'noindex, nofollow',
  });
  res.send(body);
}

/** GET /api/calendar/feed: whether the user has a subscription link, and since when. */
exports.getFeed = async (req, res) => {
  const { data, error } = await req.db
    .from('calendar_feeds')
    .select('created_at')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  res.json({ active: Boolean(data), created_at: data?.created_at ?? null });
};

/**
 * POST /api/calendar/feed: create the subscription link, or replace it
 * (rotate). The token is returned once; only its hash is stored, so it
 * cannot be shown again.
 */
exports.createFeed = async (req, res) => {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const { data, error } = await req.db
    .from('calendar_feeds')
    .upsert(
      { user_id: req.user.id, token_hash: hashToken(token), created_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select('created_at')
    .single();

  if (error) throw error;
  res.set('Cache-Control', 'no-store');
  res.status(201).json({ token, path: feedPath(token), created_at: data.created_at });
};

/** DELETE /api/calendar/feed: revoke the subscription link. */
exports.revokeFeed = async (req, res) => {
  const { error } = await req.db.from('calendar_feeds').delete().eq('user_id', req.user.id);
  if (error) throw error;
  res.json({ message: 'Calendar link revoked' });
};

/**
 * GET /api/calendar/:token.ics: the subscription feed. Not signed in:
 * calendar apps cannot send a token, so the URL is the credential. A bad
 * token counts as a failed authentication for the IP, like a bad JWT.
 */
exports.getFeedCalendar = async (req, res) => {
  const params = feedParamsSchema.safeParse(req.params);
  let feed = null;
  if (params.success) {
    const { data, error } = await createAnonClient().rpc('calendar_feed', {
      p_token: params.data.token,
    });
    if (error) throw error;
    feed = data;
  }
  if (!feed) {
    recordFailure(req.ip);
    throw new HttpError(404, 'Calendar not found');
  }

  sendCalendar(res, buildCalendar({ tasks: feed.tasks, exams: feed.exams }), {
    filename: 'trackit.ics',
    attachment: false,
    // Private: never stored by a shared cache or CDN. Short, so a revoked
    // link stops serving quickly; ETags make unchanged refreshes cheap.
    cacheControl: 'private, max-age=300',
  });
};

/** GET /api/calendar/export.ics?include=all|tasks|exams: a one-off download. */
exports.exportCalendar = async (req, res) => {
  const { include } = validate(exportQuerySchema, req.query);

  let tasks = [];
  let exams = [];
  if (include !== 'exams') {
    const { data, error } = await req.db
      .from('tasks')
      .select('id, title, description, due_date, course_code, status, grade_weight, updated_at')
      .eq('user_id', req.user.id)
      .neq('status', 'done')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });
    if (error) throw error;
    tasks = data;
  }
  if (include !== 'tasks') {
    const { data, error } = await req.db
      .from('exams')
      .select('id, subject, course_code, exam_date, topics, updated_at')
      .eq('user_id', req.user.id)
      .not('exam_date', 'is', null)
      .order('exam_date', { ascending: true });
    if (error) throw error;
    exams = data;
  }

  sendCalendar(res, buildCalendar({ tasks, exams, include }), {
    filename: include === 'all' ? 'trackit.ics' : `trackit-${include}.ics`,
    attachment: true,
    cacheControl: 'no-store',
  });
};

exports.schemas = { feedParamsSchema, exportQuerySchema };
exports.hashToken = hashToken;
