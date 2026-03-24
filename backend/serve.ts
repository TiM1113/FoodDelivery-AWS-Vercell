import { serve } from '@hono/node-server';
import app from './app';

const port = Number(process.env.PORT) || 5000;

console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
