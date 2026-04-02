import {
  FrejunOAuthConfig,
  FrejunOAuthEvents,
  AuthCodeData,
  OpenAuthPopupOptions,
  CreateTokenResponse,
  RefreshTokenResponse,
  VerifyTokenResponse,
  DisconnectResponse,
} from './types.js';
import * as api from './api.js';

const AUTHORIZATION_URL = 'https://product.frejun.com/oauth/authorize/';
const EXPECTED_ORIGIN = 'https://product.frejun.com';

type EventName = keyof FrejunOAuthEvents;

/**
 * FreJun OAuth 2.0 client.
 *
 * Handles the browser popup authorization flow, token creation / refresh / verification,
 * and exposes an event emitter so consumers can react to token changes.
 *
 * ```ts
 * const oauth = new FrejunOAuth({ clientId: '...', clientSecret: '...' });
 * oauth.on('tokens', (data) => saveTokens(data));
 * oauth.openAuthPopup();
 * ```
 */
export class FrejunOAuth {
  private readonly config: FrejunOAuthConfig;
  private listeners = new Map<EventName, Set<Function>>();
  private onceListeners = new Map<EventName, Set<Function>>();
  private popup: Window | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(config: FrejunOAuthConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('clientId and clientSecret are required');
    }
    this.config = config;
  }

  // ---------------------------------------------------------------------------
  // Authorization URL
  // ---------------------------------------------------------------------------

  /** Build the FreJun authorization URL with all configured query params. */
  getAuthorizationUrl(): string {
    const url = new URL(AUTHORIZATION_URL);
    url.searchParams.set('client_id', this.config.clientId);

    if (this.config.redirectUri) {
      url.searchParams.set('redirect_uri', this.config.redirectUri);
    }

    if (this.config.extraParams) {
      for (const [key, value] of Object.entries(this.config.extraParams)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  // ---------------------------------------------------------------------------
  // Browser popup flow
  // ---------------------------------------------------------------------------

  /**
   * Open the FreJun consent page in a popup and listen for the authorization
   * code via `window.postMessage`.
   *
   * @param options.generateTokens — When `true` (default), automatically exchanges
   *   the auth code for tokens. Set to `false` when token generation happens on
   *   your backend — listen for the `'codeReceived'` event to get the code.
   *
   * **Browser-only** — throws in non-browser environments.
   */
  openAuthPopup(options: OpenAuthPopupOptions = {}): void {
    const { generateTokens = true } = options;

    if (typeof window === 'undefined') {
      throw new Error('openAuthPopup() is only available in browser environments');
    }

    const authUrl = this.getAuthorizationUrl();

    // Center the popup on screen
    const width = 600;
    const height = 700;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    this.popup = window.open(
      authUrl,
      'frejun-oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
    );

    this.messageHandler = (event: MessageEvent) => {
      // Only accept messages from the FreJun consent page
      if (event.origin !== EXPECTED_ORIGIN || !event.data) return;
      if (event.data.eventName !== 'oauth-code') return;

      const { code, email, ...otherParams } = (event.data.data || {}) as Record<string, string>;

      // Clean up popup + listener regardless of outcome
      this.cleanupPopup();

      if (!code) {
        this.emit('error', new Error('OAuth authorization was declined or no code received'));
        return;
      }

      const authCodeData: AuthCodeData = { code, email, ...otherParams };
      this.emit('authCode', authCodeData);

      if (generateTokens) {
        // Automatically exchange the code for tokens
        this.createTokens(code).catch((err: unknown) => {
          this.emit('error', err instanceof Error ? err : new Error(String(err)));
        });
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  // ---------------------------------------------------------------------------
  // Token operations
  // ---------------------------------------------------------------------------

  /** Exchange an authorization code for access & refresh tokens. Emits `'tokens'`. */
  async createTokens(code: string): Promise<CreateTokenResponse> {
    const response = await api.createTokens(
      this.config.clientId,
      this.config.clientSecret,
      code,
    );
    this.emit('tokens', response);
    return response;
  }

  /** Refresh an expired access token. Emits `'tokensRefreshed'`. */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await api.refreshTokens(
      this.config.clientId,
      this.config.clientSecret,
      refreshToken,
    );
    this.emit('tokensRefreshed', response);
    return response;
  }

  /** Verify whether a token (access or refresh) is still valid. */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    return api.verifyToken(token);
  }

  /**
   * Disconnect the OAuth app from the organization.
   * Revokes all refresh tokens for this client and org, and removes the app-org link.
   */
  async disconnect(refreshToken: string): Promise<DisconnectResponse> {
    return api.disconnect(
      this.config.clientId,
      this.config.clientSecret,
      refreshToken,
    );
  }

  // ---------------------------------------------------------------------------
  // Event emitter (isomorphic — no Node `events` dependency)
  // ---------------------------------------------------------------------------

  /** Subscribe to an event. */
  on<E extends EventName>(event: E, listener: FrejunOAuthEvents[E]): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  /** Unsubscribe from an event. */
  off<E extends EventName>(event: E, listener: FrejunOAuthEvents[E]): this {
    this.listeners.get(event)?.delete(listener);
    this.onceListeners.get(event)?.delete(listener);
    return this;
  }

  /** Subscribe to an event — listener is automatically removed after the first call. */
  once<E extends EventName>(event: E, listener: FrejunOAuthEvents[E]): this {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(listener);
    // Also register in the main listeners map so it fires normally
    this.on(event, listener);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Remove all listeners and close the popup if open. */
  destroy(): void {
    this.cleanupPopup();
    this.listeners.clear();
    this.onceListeners.clear();
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private emit<E extends EventName>(event: E, ...args: Parameters<FrejunOAuthEvents[E]>): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        (listener as Function)(...args);
      } catch (err) {
        // Avoid swallowing errors silently — log to console
        console.error(`Error in "${event}" listener:`, err);
      }
    }

    // Remove one-shot listeners after firing
    const onceSet = this.onceListeners.get(event);
    if (onceSet) {
      for (const listener of onceSet) {
        this.listeners.get(event)?.delete(listener);
      }
      onceSet.clear();
    }
  }

  private cleanupPopup(): void {
    if (this.messageHandler && typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.popup = null;
  }
}
