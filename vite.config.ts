import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function serveStaticSite(): Plugin {
  const siteDir = path.resolve(__dirname, 'site');
  return {
    name: 'serve-all2k-site',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const urlPath = (req.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
        const normalized = urlPath.startsWith('/2kweb/')
          ? urlPath.slice('/2kweb'.length)
          : urlPath === '/2kweb'
            ? '/'
            : urlPath;

        if (normalized.startsWith('/@')) {
          return next();
        }

        let target = path.join(siteDir, normalized === '/' ? 'index.html' : normalized);
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
          target = path.join(target, 'index.html');
        }
        if (fs.existsSync(target) && fs.statSync(target).isFile()) {
          const ext = path.extname(target);
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
          fs.createReadStream(target).pipe(res);
          return;
        }
        const notFound = path.join(siteDir, '404.html');
        if (fs.existsSync(notFound)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(notFound).pipe(res);
          return;
        }
        return next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveStaticSite()],
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
