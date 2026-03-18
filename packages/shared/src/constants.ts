// Fallback constants — used only when VITE_API_URL / VITE_S3_URL are not set.
// In production these must always be set via Vercel Environment Variables.
// Empty strings here force an obvious failure rather than silently hitting a wrong URL.
export const API_BASE_URL = "";
export const S3_BASE_URL = "";
