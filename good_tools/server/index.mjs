import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(options = {}) {
  const publicDir = options.publicDir || process.env.PUBLIC_DIR || path.resolve(__dirname, '../web/dist');
  const dataDir = options.dataDir || process.env.DATA_DIR || path.resolve(__dirname, '../../.local_data');
  const allowNetworkTools =
    options.allowNetworkTools ?? (process.env.ALLOW_NETWORK_TOOLS !== 'false');
  const allowLanTools =
    options.allowLanTools ?? (process.env.ALLOW_LAN_TOOLS === 'true');
  const defaultTheme = options.defaultTheme || process.env.DEFAULT_THEME || 'system';
  const appVersion = options.appVersion || process.env.APP_VERSION || '1.3.3';

  const app = express();
  app.disable('x-powered-by');
  if (process.env.INGRESS_ONLY === 'true') {
    app.use((req, res, next) => {
      if (req.socket.remoteAddress !== '172.30.32.2') return res.sendStatus(403);
      next();
    });
  }
  app.use(express.json({ limit: '2mb' }));

  // Basic security headers (Ingress iframe-compatible)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use('/api', createApiRouter({ dataDir, allowNetworkTools, allowLanTools, defaultTheme, appVersion }));

  // Serve static SPA assets (never cache index.html so HA app updates appear immediately)
  if (fs.existsSync(publicDir)) {
    app.use(
      express.static(publicDir, {
        index: 'index.html',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          }
        },
      })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        message: 'Good Tools API server is running. Frontend build not found at PUBLIC_DIR.',
        publicDir,
      });
    });
  }

  // Global error handler (prevents crashes on unexpected Express/JSON errors)
  app.use((err, _req, res, _next) => {
    console.error('[Good Tools] Unhandled error:', err?.message || err);
    if (!res.headersSent) {
      res.status(err?.status || 500).json({ error: '서버 요청 처리 중 오류가 발생했습니다.' });
    }
  });

  return app;
}

// Start server only when executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = Number(process.env.PORT || 8099);
  const host = process.env.HOST || '0.0.0.0';
  const app = createApp();
  app.listen(port, host, () => {
    console.log(`[Good Tools] Listening on http://${host}:${port}`);
  });
}
