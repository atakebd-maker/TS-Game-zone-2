import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // In-memory persistent database store (with initial sample data)
  let settings = {
    brandName: 'TS Game Zone',
    tagline: 'free online game site free entertainment game site Ts game zone',
    announcementText: '🔥 Welcome to TS Game Zone! Play 100% Free Games & Earn Coins on Every Match!',
    showAnnouncement: true,
    showSponsoredAds: true,
    contactEmail: 'support@tsgamezone.com',
  };

  // --- API Routes ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(settings);
  });

  app.put('/api/admin/settings', (req: Request, res: Response) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
  });

  // Admin login route
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (
      (email === 'admin@novaplay.com' && password === 'admin123') ||
      (email === 'admin' && password === 'admin')
    ) {
      res.json({
        success: true,
        token: `admin_token_${Date.now()}`,
        admin: { email: 'admin@novaplay.com', name: 'Super Admin' },
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
    }
  });

  // URL security validator
  app.post('/api/admin/validate-url', (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ valid: false, message: 'URL is required' });
    try {
      const parsed = new URL(url);
      const allowed = ['itch.io', 'crazygames.com', 'poki.com', 'html5.gamedistribution.com', 'games.gamepix.com', 'github.io'];
      const isAllowed = allowed.some((h) => parsed.hostname.endsWith(h) || parsed.hostname === h);
      res.json({
        valid: isAllowed,
        message: isAllowed
          ? 'URL authorized for secure iframe embedding.'
          : 'Domain is not in the trusted whitelist of authorized game CDNs.',
      });
    } catch {
      res.status(400).json({ valid: false, message: 'Invalid URL format' });
    }
  });

  // SEO: robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${process.env.APP_URL || ''}/sitemap.xml\n`);
  });

  // SEO: sitemap.xml
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    res.type('application/xml');
    const baseUrl = process.env.APP_URL || 'https://novaplay.games';
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/all-games</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/responsible-gaming</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
    res.send(sitemap);
  });

  // Vite Integration in Development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`NovaPlay Games server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
