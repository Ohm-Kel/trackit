const crypto = require('crypto');
const express = require('express');
const { buildOpenApiDocument } = require('../lib/openapi');

const router = express.Router();
const document = buildOpenApiDocument();

// Swagger UI comes from a pinned CDN build, so this one page gets its own
// Content-Security-Policy instead of helmet's same-origin default. The inline
// init script is allowed by hash rather than 'unsafe-inline'.
const CDN_ORIGIN = 'https://cdn.jsdelivr.net';
const CDN = `${CDN_ORIGIN}/npm/swagger-ui-dist@5.17.14`;

const INIT_SCRIPT = `window.onload = () => {
  window.ui = SwaggerUIBundle({ url: 'openapi.json', dom_id: '#swagger-ui', deepLinking: true });
};`;
const INIT_HASH = crypto.createHash('sha256').update(INIT_SCRIPT).digest('base64');

const CSP = [
  "default-src 'self'",
  `script-src 'self' ${CDN_ORIGIN} 'sha256-${INIT_HASH}'`,
  `style-src 'self' ${CDN_ORIGIN} 'unsafe-inline'`,
  `img-src 'self' data: ${CDN_ORIGIN}`,
  "connect-src 'self'",
].join('; ');

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Trackit API docs</title>
    <link rel="stylesheet" href="${CDN}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${CDN}/swagger-ui-bundle.js" crossorigin></script>
    <script>${INIT_SCRIPT}</script>
  </body>
</html>`;

/** GET /api/openapi.json — machine-readable API description. */
router.get('/openapi.json', (req, res) => {
  res.json(document);
});

/** GET /api/docs — interactive Swagger UI. */
router.get('/docs', (req, res) => {
  res.set('Content-Security-Policy', CSP).type('html').send(PAGE);
});

module.exports = router;
