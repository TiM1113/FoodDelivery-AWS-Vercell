import { describe, it, expect } from 'vitest';
import app from '../app';

describe('App smoke tests', () => {
  it('responds 200 on root health check', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('API Working');
    expect(body.version).toBe('3.0.0');
  });

  it('responds 200 on /api/health', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('healthy');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await app.request('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('has all expected route groups mounted', async () => {
    // Verify routes are registered by hitting known endpoints with correct methods.
    // We accept any non-404 status (401, 500, etc.) as proof the route is mounted.
    // DB/auth errors are expected here — we only care about route registration.
    const routes = [
      { method: 'GET', path: '/api/food/list' },
      { method: 'POST', path: '/api/user/login' },
      { method: 'POST', path: '/api/cart/get' },
      { method: 'POST', path: '/api/order/place' },
      { method: 'POST', path: '/api/kyc/webhook' },
    ];

    for (const { method, path } of routes) {
      const res = await app.request(path, { method });
      expect(res.status, `${method} ${path} should be mounted`).not.toBe(404);
    }
  });
});
