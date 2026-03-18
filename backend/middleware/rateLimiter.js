import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Single shared Redis client — reused across all limiters
const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Login: 5 requests per IP per minute
const loginLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(5, '1 m'),
	prefix: 'rl:login',
});

// Register: 3 requests per IP per hour
const registerLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(3, '1 h'),
	prefix: 'rl:register',
});

// Order placement: 3 requests per user per minute
const orderLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(3, '1 m'),
	prefix: 'rl:order',
});

// Extract real client IP — Vercel puts it in x-forwarded-for header
const getIp = (req) => {
	const forwarded = req.headers['x-forwarded-for'];
	if (forwarded) return forwarded.split(',')[0].trim();
	return req.socket?.remoteAddress ?? 'unknown';
};

// Middleware factory: takes a limiter and an identifier function
const makeRateLimiter = (limiter, getIdentifier) => async (req, res, next) => {
	try {
		const identifier = getIdentifier(req);
		const { success, limit, remaining, reset } = await limiter.limit(identifier);

		res.setHeader('X-RateLimit-Limit', limit);
		res.setHeader('X-RateLimit-Remaining', remaining);
		res.setHeader('X-RateLimit-Reset', reset);

		if (!success) {
			const retryAfter = Math.ceil((reset - Date.now()) / 1000);
			res.setHeader('Retry-After', retryAfter);
			return res.status(429).json({
				success: false,
				message: 'Too many requests, please try again later',
				retryAfter,
			});
		}

		next();
	} catch (err) {
		// If Redis is unreachable, fail open (allow request) to avoid blocking users
		console.error('Rate limiter error:', err.message);
		next();
	}
};

// Exported middleware — each bound to its limiter and identifier strategy
export const loginRateLimit    = makeRateLimiter(loginLimiter,    getIp);
export const registerRateLimit = makeRateLimiter(registerLimiter, getIp);
export const orderRateLimit    = makeRateLimiter(orderLimiter,    (req) => req.userId ?? getIp(req));
