# @frejun/oauth

FreJun OAuth 2.0 SDK for TypeScript / JavaScript. Handles the browser popup authorization flow, token management, and notifies your app of token changes via events.

## Installation

```bash
npm install @frejun/oauth
```

## Quick Start

```ts
import { FrejunOAuth } from '@frejun/oauth';

const oauth = new FrejunOAuth({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://yourapp.com/callback', // optional
  extraParams: { state: 'random-csrf-token' }, // optional
});

// Listen for new tokens
oauth.on('tokens', (data) => {
  console.log('Access token:', data.access_token);
  console.log('Refresh token:', data.refresh_token);
  console.log('Expires in:', data.expires_in);
});

// Listen for refreshed tokens
oauth.on('tokensRefreshed', (data) => {
  console.log('New access token:', data.access_token);
  console.log('New refresh token:', data.refresh_token);
});

// Listen for errors
oauth.on('error', (err) => {
  console.error('OAuth error:', err.message);
});

// Open the FreJun consent popup (browser only)
oauth.openAuthPopup();
```

## API

### `new FrejunOAuth(config)`

| Option | Type | Required | Description |
|---|---|---|---|
| `clientId` | `string` | Yes | Your FreJun OAuth app client ID |
| `clientSecret` | `string` | Yes | Your FreJun OAuth app client secret |
| `redirectUri` | `string` | No | Override the registered redirect URI |
| `extraParams` | `Record<string, string>` | No | Extra query params (state, username, etc.) |

### Methods

#### `getAuthorizationUrl()`
Returns the FreJun authorization URL as a `string`.

#### `openAuthPopup(options?)`
Opens the consent page in a popup and listens for the auth code via `postMessage`. By default, automatically exchanges the code for tokens. Pass `{ generateTokens: false }` to skip token generation (useful when tokens are generated on your backend). Browser only.

#### `createTokens(code)`
Exchange an auth code for tokens. Emits `'tokens'`. Returns:
```ts
{
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;       // seconds
  token_type: string;
  org_identifier: string;
  // On error: statusCode is also included
  statusCode?: number;
}
```

#### `refreshTokens(refreshToken)`
Refresh an expired access token. Emits `'tokensRefreshed'`. Returns:
```ts
{
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;       // seconds
  org_identifier: string;
  // On error: statusCode is also included
  statusCode?: number;
}
```

#### `verifyToken(token)`
Check whether an access or refresh token is valid. Returns:
```ts
// Valid token
{ is_valid: true }

// Invalid token or API error
{ is_valid: false; statusCode?: number; [key: string]: unknown }
```

#### `disconnect(refreshToken)`
Disconnect the OAuth app from the organization. Revokes all tokens for this organization. Returns:
```ts
{
  success: boolean;
  message: string;
  // On error: statusCode is also included
  statusCode?: number;
}
```

#### `destroy()`
Clean up all listeners and close any open popup.

### Events

| Event | Payload | When |
|---|---|---|
| `authCode` | `{ code, email, ...extraParams }` | Auth code received from popup |
| `tokens` | `CreateTokenResponse` | Tokens created from an auth code |
| `tokensRefreshed` | `RefreshTokenResponse` | Tokens refreshed |
| `error` | `Error` | Any error during the flow |

#### `on(event, listener)`

Subscribe to an event. The listener is called every time the event fires.

```ts
// Called on every token refresh
oauth.on('tokensRefreshed', (data) => {
  saveTokens(data.access_token, data.refresh_token);
});
```

#### `once(event, listener)`

Subscribe to an event, but the listener is automatically removed after it fires once.

```ts
// Only capture the first set of tokens
oauth.once('tokens', (data) => {
  console.log('Initial tokens received:', data.access_token);
});
```

#### `off(event, listener)`

Remove a previously registered listener.

```ts
const handler = (data) => { /* ... */ };
oauth.on('tokens', handler);
// Later, unsubscribe
oauth.off('tokens', handler);
```

## Backend Token Generation

If you need to generate tokens on your server instead of the browser, disable automatic token exchange and listen for the `authCode` event:

```ts
oauth.on('authCode', async ({ code, email, ...params }) => {
  // Send the code to your backend for token generation
  await fetch('/api/auth/frejun', { // your backend endpoint
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, email, ...params }),
  });
});

oauth.openAuthPopup({ generateTokens: false });
```

## Error Handling

API calls **never throw** for HTTP-level errors. Instead, all functions return an error object containing the API's response body merged with a `statusCode` field. You can detect failures by checking a `success` field (present on most endpoints) or `is_valid` for `verifyToken`.

```ts
const result = await oauth.verifyToken(token);
if (result.is_valid) {
  // token is valid
} else {
  // result contains { is_valid: false, statusCode, ...apiErrorFields }
  console.error('Invalid token:', result);
}

const tokens = await oauth.createTokens(code);
if (!tokens.success) {
  // tokens contains { success: false, statusCode, message, ...apiErrorFields }
  console.error('Token creation failed:', tokens.message);
}
```

Only network-level failures (e.g. no internet connection) will result in a thrown error or an emitted `'error'` event.

## Notes

- The authorization code expires in **10 minutes**.
