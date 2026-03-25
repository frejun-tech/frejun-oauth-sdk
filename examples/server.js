const { FrejunOAuth } = require('../dist/cjs/index.js');
const { FREJUN_CLIENT_ID, FREJUN_CLIENT_SECRET } = require('./env.js');

const oauth = new FrejunOAuth({
  clientId: FREJUN_CLIENT_ID,
  clientSecret: FREJUN_CLIENT_SECRET,
});

oauth.on('tokens', (data) => {
  console.log('Tokens created:', data.access_token);
});

oauth.on('tokensRefreshed', (data) => {
  console.log('Tokens refreshed:', data.access_token);
});

oauth.on('error', (err) => {
  console.error('Error:', err.message);
});

async function main() {
  // 1. Exchange an auth code for tokens
  const tokens = await oauth.createTokens('AUTH_CODE_FROM_REDIRECT');
  console.log('Access token:', tokens.access_token);

  // 2. Verify the access token
  const result = await oauth.verifyToken(tokens.access_token);
  console.log('Verify result:', result);

  // 3. Refresh when the access token expires
  const refreshed = await oauth.refreshTokens(tokens.refresh_token);
  console.log('New access token:', refreshed.access_token);
}

main().catch(console.error);
