# Contributing

Thanks for taking the time to contribute to `@frejun/oauth`. Bug reports,
documentation fixes, and code changes are all welcome.

Please read the [code of conduct](./CODE_OF_CONDUCT.md) before contributing.

## Before you start

- Check the [README](./README.md) and the [FreJun docs](https://frejun.com/docs/)
  — many questions about request fields or response shapes are answered there.
- Search existing issues. If the problem is already reported, add your details
  to that thread instead of opening a new one.
- **Never include credentials** in an issue, pull request, or commit. Redact your
  `clientSecret`, access and refresh tokens, and authorization codes before
  pasting logs or code.
- Found a security vulnerability? Do not open a public issue — follow
  [SECURITY.md](./SECURITY.md).

## Filing an issue

A good bug report includes:

- the `@frejun/oauth` version, and whether you use it in the **browser** or on
  **Node.js** (with the browser or Node version)
- which method or event is involved — e.g. `openAuthPopup`, `createTokens`,
  `refreshTokens`, `tokensRefreshed`
- a minimal code snippet that reproduces the problem
- what you expected, and what actually happened — including the returned
  object (`success`, `statusCode`, `message`) or the thrown error

## Development setup

You need [Node.js](https://nodejs.org/) 18 or later.

```sh
npm install
npm run build     # builds both dist/cjs and dist/esm
```

`examples/browser.html` and `examples/server.js` show the browser popup flow and
backend token generation. Use them to check your change end to end against your
own FreJun OAuth app.

## Opening a pull request

1. Fork the repository and create a branch off `main`.
2. Keep the change focused — one fix or one feature per pull request.
3. Make sure `npm run build` succeeds with no TypeScript errors.
4. Match the existing code style; don't reformat unrelated code.
5. If you change the public API, events, or return shapes, update the README.
6. Describe what changed, why, and how you tested it.

## Licensing

Contributions are accepted under the repository's [MIT licence](./LICENSE). By
opening a pull request you confirm you have the right to submit the code under
that licence.

## Questions

Open an issue, or email [support@frejun.com](mailto:support@frejun.com).
