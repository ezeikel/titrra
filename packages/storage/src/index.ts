/**
 * @titrra/storage
 *
 * Shared Cloudflare R2 storage client for Titrra. `put`, `del`, `list`, `exists`
 * with the same API surface as @vercel/blob. Consumed as source (no build step).
 */

export type { ListOptions, ListResult, PutOptions, PutResult } from './r2.js';
export { del, exists, list, put } from './r2.js';
