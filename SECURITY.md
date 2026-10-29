# Security policy

This policy covers `@frejun/oauth` and the FreJun OAuth endpoints it talks to.

## Supported versions

Security fixes are released for the latest published version only. Check the
[npm page](https://www.npmjs.com/package/@frejun/oauth) for the current version
and upgrade before reporting.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues or
pull requests.**

Email [support@frejun.com](mailto:support@frejun.com) with the subject line
`SECURITY: @frejun/oauth` and a description of the issue.

To help us reproduce and assess it quickly, include what you can of:

- the SDK version, and whether it runs in the browser or on Node.js
- the type of issue — for example authorization-code interception, a
  `postMessage` origin check bypass, token leakage, `state` / CSRF handling, or
  an authentication bypass
- step-by-step instructions to reproduce, with any proof-of-concept code
- the impact you believe it has, and which accounts or data it could reach

## What happens next

We will acknowledge your report by email, tell you whether we could reproduce
it, and keep you updated while we work on a fix. We appreciate reports made in
good faith and, if you'd like, will acknowledge your contribution when we
publish the fix.

## Please do

- Give us a reasonable chance to fix the issue before disclosing it publicly.
- Test only against your own FreJun account, OAuth app, and data.
- Stop once you have confirmed the issue, and access only the minimum data
  needed to demonstrate it.

## Please do not

- Access, modify, or delete data belonging to another FreJun account.
- Run denial-of-service, load, or brute-force testing against FreJun services.
- Use social engineering or phishing against FreJun staff or customers.

## If your credentials are exposed

If your OAuth `clientSecret` or an access or refresh token has been exposed
(for example committed to a public repository or shipped in a frontend
bundle), email [support@frejun.com](mailto:support@frejun.com) straight away so
we can revoke them and review account activity. You can also revoke all tokens
for an organization with `disconnect(refreshToken)`.

Never include live credentials in a report — redact them and tell us where they
were exposed instead.

## Non-security issues

For bugs without a security impact, open a normal issue. See
[CONTRIBUTING.md](./CONTRIBUTING.md).
