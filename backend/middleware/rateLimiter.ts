import { MiddlewareHandler } from 'hono';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { AppEnv } from '../types';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const loginLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(5, '1 m'),
	prefix: 'rl:login',
});

const registerLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(3, '1 h'),
	prefix: 'rl:register',
});

const orderLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(3, '1 m'),
	prefix: 'rl:order',
});

const getClientIp = (c: { req: { header: (name: string) => string | undefined } }): string =>
	c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
	?? c.req.header('x-real-ip')
	?? 'unknown';

const makeRateLimiter = (
	limiter: Ratelimit,
	getIdentifier: (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => string,
): MiddlewareHandler<AppEnv> => {
	return async (c, next) => {
		const identifier = getIdentifier(c);

		let result;
		try {
			result = await limiter.limit(identifier);
		} catch (err) {
			console.error('Rate limiter Redis error:', (err as Error).message);
			return next();
		}

		const { success, limit, remaining, reset } = result;

		c.header('X-RateLimit-Limit', String(limit));
		c.header('X-RateLimit-Remaining', String(remaining));
		c.header('X-RateLimit-Reset', String(reset));

		if (!success) {
			const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
			c.header('Retry-After', String(retryAfter));
			return c.json({
				success: false,
				message: 'Too many requests, please try again later',
				retryAfter,
			}, 429);
		}

		await next();
	};
};

export const loginRateLimit = makeRateLimiter(loginLimiter, getClientIp);
export const registerRateLimit = makeRateLimiter(registerLimiter, getClientIp);
export const orderRateLimit = makeRateLimiter(
	orderLimiter,
	(c) => c.get('userId') ?? getClientIp(c),
);
