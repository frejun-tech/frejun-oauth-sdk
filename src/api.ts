import {
  CreateTokenResponse,
  RefreshTokenResponse,
  VerifyTokenResponse,
  DisconnectResponse,
} from './types.js';

const BASE_URL = 'https://api.frejun.com/api/v2';

/** Base64-encode client credentials for the Authorization header. */
function encodeCredentials(clientId: string, clientSecret: string): string {
  const raw = `${clientId}:${clientSecret}`;
  if (typeof btoa === 'function') {
    return btoa(raw);
  }
  // Node.js fallback
  return Buffer.from(raw).toString('base64');
}

/** Parse a JSON response body; returns body on success or an error object on non-2xx (never throws). */
async function handleResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ...body,
      statusCode: response.status,
    } as unknown as T;
  }
  return body as T;
}

/**
 * Exchange an authorization code for access and refresh tokens.
 * `GET /oauth/token/?code=<code>`
 */
export async function createTokens(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<CreateTokenResponse> {
  const credentials = encodeCredentials(clientId, clientSecret);
  const url = `${BASE_URL}/oauth/token/?code=${encodeURIComponent(code)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${credentials}` },
  });
  return handleResponse<CreateTokenResponse>(response);
}

/**
 * Refresh an expired access token.
 * `POST /oauth/token/refresh/`
 */
export async function refreshTokens(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  const credentials = encodeCredentials(clientId, clientSecret);
  const response = await fetch(`${BASE_URL}/oauth/token/refresh/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const raw = await handleResponse<Record<string, unknown>>(response);
  // Normalize `access`/`refresh` → `access_token`/`refresh_token`
  return {
    success: raw.success as boolean,
    message: raw.message as string,
    access_token: (raw.access ?? raw.access_token) as string,
    refresh_token: (raw.refresh ?? raw.refresh_token) as string,
    expires_in: raw.expires_in as number,
    org_identifier: raw.org_identifier as string,
  };
}

/**
 * Verify whether an access or refresh token is still valid.
 * `POST /oauth/verify-token/`  (no Authorization header required)
 */
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch(`${BASE_URL}/oauth/verify-token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const result = await handleResponse<Record<string, unknown>>(response);
    if (response.ok) return { is_valid: true };
    return { is_valid: false, ...result };
  } catch (err: any) {
    console.log(err);
    return { is_valid: false };
  }
}

/**
 * Disconnect the OAuth app from the org associated with the refresh token.
 * `POST /oauth/disconnect-oauth-app/`
 */
export async function disconnect(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<DisconnectResponse> {
  const credentials = encodeCredentials(clientId, clientSecret);
  const response = await fetch(`${BASE_URL}/oauth/disconnect-oauth-app/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  return handleResponse<DisconnectResponse>(response);
}
