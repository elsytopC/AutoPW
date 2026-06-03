import { APIRequestContext, request } from '@playwright/test';
import { env } from '@config/env';

/**
 * Creates an APIRequestContext for the RealWorld (Conduit) API.
 *
 * RealWorld authenticates with `Authorization: Token <token>` (not Bearer).
 * The base URL keeps a trailing slash and services use path-relative URLs
 * (e.g. `articles`, not `/articles`) so the `/api` prefix is preserved by URL
 * resolution instead of being dropped.
 */
export async function createConduitContext(
  token?: string,
): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: env.conduitApiUrl.replace(/\/?$/, '/'),
    extraHTTPHeaders: token ? { Authorization: `Token ${token}` } : {},
  });
}
