import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
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
        const urlPath = req.url.split('?')[0].split('#')[0];
        const normalized = urlPath.startsWith('/2kweb/')
          ? urlPath.slice('/2kweb'.length)
          : urlPath === '/2kweb'
            ? '/'
            : urlPath;

        if (normalized.startsWith('/@') || normalized.startsWith('/src/')) {
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
        return next();
      });
    },
    closeBundle(error?: Error) {
      if (error) return;
      const distDir = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distDir) && fs.existsSync(siteDir)) {
        fs.cpSync(siteDir, distDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), serveStaticSite()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
