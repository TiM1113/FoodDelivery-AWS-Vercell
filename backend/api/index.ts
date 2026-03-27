import { handle } from '@hono/node-server/vercel';
import app from '../app';

export const config = {
	maxDuration: 30,
};

export default handle(app);
