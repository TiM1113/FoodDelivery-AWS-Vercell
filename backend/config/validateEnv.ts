const REQUIRED = [
	'MONGODB_URI',
	'JWT_SECRET',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'UPSTASH_REDIS_REST_URL',
	'UPSTASH_REDIS_REST_TOKEN',
	'FRONTEND_URL',
];

const OPTIONAL = [
	'AWS_ACCESS_KEY_ID',
	'AWS_SECRET_ACCESS_KEY',
	'AWS_REGION',
	'AWS_BUCKET_NAME',
	'CORS_ALLOWED_ORIGINS',
	'PORT',
	'NODE_ENV',
];

export function validateEnv() {
	const missing = REQUIRED.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
			'Set them in your .env file (local) or Vercel Environment Variables (production).'
		);
	}

	const missingOptional = OPTIONAL.filter((key) => !process.env[key]);
	if (missingOptional.length > 0) {
		console.warn(
			`[validateEnv] Optional environment variables not set: ${missingOptional.join(', ')}`
		);
	}
}
