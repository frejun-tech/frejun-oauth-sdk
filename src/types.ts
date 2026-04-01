/** Configuration required to initialize the FreJun OAuth client. */
export interface FrejunOAuthConfig {
  clientId: string;
  clientSecret: string;
  /** Optional override for the redirect URI registered with the app. */
  redirectUri?: string;
  /** Extra query params appended to the authorization URL (e.g. state, username). */
  extraParams?: Record<string, string>;
}

/** Response from `GET /oauth/token/` — creating tokens from an auth code. */
export interface CreateTokenResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  org_identifier: string;
}

/**
 * Response from `POST /oauth/token/refresh/`.
 * The API returns `access`/`refresh` but the SDK normalizes them to
 * `access_token`/`refresh_token` for consistency with CreateTokenResponse.
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  org_identifier: string;
}

/** Response from `POST /oauth/verify-token/`. */
export interface VerifyTokenResponse {
  [key: string]: unknown;
}

/** Response from `POST /oauth/disconnect-oauth-app/`. */
export interface DisconnectResponse {
  success: boolean;
  message: string;
}

/** Data received via the postMessage / redirect after user authorization. */
export interface AuthCodeData {
  code: string;
  email: string;
  [key: string]: string;
}

/** Typed event map for the FrejunOAuth event emitter. */
export interface FrejunOAuthEvents {
  /** Fired when an authorization code is received from the popup. */
  authCode: (data: AuthCodeData) => void;
  /** Fired when new access/refresh tokens are created from an auth code. */
  tokens: (data: CreateTokenResponse) => void;
  /** Fired when tokens are refreshed. */
  tokensRefreshed: (data: RefreshTokenResponse) => void;
  /** Fired on any error during the OAuth flow. */
  error: (error: Error) => void;
}

/** Error thrown when a FreJun API request fails. */
export class FrejunApiError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  constructor(message: string, statusCode: number, responseBody: unknown) {
    super(message);
    this.name = 'FrejunApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
