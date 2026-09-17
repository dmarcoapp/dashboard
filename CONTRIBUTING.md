# Contributing

This repository holds the DMARCo dashboard: the React single-page app and its
nginx image. Pull requests for that code belong here.

**Issues belong in [`dmarcoapp/dmarcoapp`](https://github.com/dmarcoapp/dmarcoapp/issues),**
together with every other DMARCo issue, so nobody has to guess which component
a problem comes from.

The full contribution guide lives in the main repository:
[`CONTRIBUTING.md`](https://github.com/dmarcoapp/dmarcoapp/blob/main/CONTRIBUTING.md).

Before you push, run what CI runs:

```bash
npm run lint
npm run build
```

Coding standards and UI conventions for this repository are in
[`AGENTS.md`](AGENTS.md).
