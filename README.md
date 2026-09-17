<p align="center">
  <img src=".github/logo.svg" alt="" width="80" height="80">
</p>

<h1 align="center">DMARCo Dashboard</h1>

<p align="center">
  Self-hosted DMARC monitoring: the web UI behind DMARCo.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg"></a>
  <a href="https://github.com/dmarcoapp/dashboard/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/dmarcoapp/dashboard/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/dmarcoapp/dashboard/pkgs/container/dashboard"><img alt="Container image" src="https://img.shields.io/badge/ghcr.io-dmarcoapp%2Fdashboard-1f6feb"></a>
</p>

> [!IMPORTANT]
> **Start at [dmarcoapp/dmarcoapp](https://github.com/dmarcoapp/dmarcoapp).**
> That repository installs all of DMARCo with one command: this dashboard, the
> backend, and the mail gateway. It is also the issue tracker for the whole
> project, so
> [report anything that goes wrong there](https://github.com/dmarcoapp/dmarcoapp/issues/new/choose),
> including problems in this component. What follows is one component's source,
> for people working on it.

The dashboard is where DMARC reports become readable: volume, pass rates, and
trends, the senders behind them, per-domain protection and alignment, and the
account screens that go with it. It talks to a DMARCo-compatible API, and falls
back to bundled sample data when there is no API to talk to.

## Overview

```text
Browser -> Dashboard UI -> DMARCo API -> DMARC reports
```

This repository contains the frontend application:

- React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- nginx production image for serving the built single-page app
- Docker Compose files for local development and production-style hosting
- mock mode for trying the UI without a backend

The dashboard expects a backend API that exposes the `/v1` endpoints used by the
app, normally [`dmarcoapp/backend`](https://github.com/dmarcoapp/backend). For
inbound report collection, see
[`dmarcoapp/mail-inbound`](https://github.com/dmarcoapp/mail-inbound).

## Features

- Dashboard cards for report count, message volume, pass rate, and threats
  blocked, each with a trend against the previous period
- Message volume, compliance, top senders, top offenders, reporting
  organizations, source countries, and newly seen domains
- Report browsing with filtering, sorting, pagination, record details, XML
  preview, and bulk deletion
- Domain list and per-domain pages with the published DMARC record, a protection
  level, and DKIM and SPF alignment
- Blocklist management
- Login, registration, email verification, password reset, two-factor
  authentication, profile, and notification settings
- Responsive layout for desktop and mobile

## Requirements

- Node.js 20 or newer, and npm, for local development
- Docker and Docker Compose v2, for the containerized development stack and for
  building the production image
- A reachable DMARCo backend for real data. Without one, mock mode runs the
  whole UI on bundled sample data

## Get started

Clone the repository and create local configuration:

```bash
git clone https://github.com/dmarcoapp/dashboard.git
cd dashboard
cp .env.local.example .env.local
```

For a first run without a backend, keep mock mode enabled:

```env
VITE_MOCK_MODE=true
```

Then install dependencies and start the development server:

```bash
npm install
npm run dev
```

The Vite dev server prints the local URL, usually `http://localhost:8080`. The
backend's development stack publishes its API on that same port, so move one of
them if you run both.

## Configuration

### Container runtime configuration

The production image is generic: it reads its configuration from environment
variables when the container starts, so the same image works for any deployment
without a rebuild.

| Variable | Purpose |
| --- | --- |
| `DMARCO_API_BASE_URL` | Base URL of the DMARCo-compatible backend API. Can be an absolute URL such as `https://api.example.com`, or a same-origin path such as `/api` when a reverse proxy routes the API under the dashboard domain. |
| `DMARCO_DISABLE_REGISTRATION` | Set to `true` to hide public registration |
| `DMARCO_MOCK_MODE` | Set to `true` to force the bundled mock data |

On startup the entrypoint writes these values to
`/usr/share/nginx/html/config.js`, which the app loads before it boots. The file
is served with `Cache-Control: no-store`, so a restart with new values takes
effect immediately.

### Build-time configuration

During development, and when building the image yourself, the same settings come
from Vite environment variables:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_DISABLE_REGISTRATION=false
VITE_MOCK_MODE=false
```

- `VITE_API_BASE_URL`: base URL of the DMARCo-compatible backend API
- `VITE_DISABLE_REGISTRATION`: set to `true` to hide public registration
- `VITE_MOCK_MODE`: set to `true` to use bundled mock data, or `false` to call
  the real API

Runtime values take precedence over build-time values. For local exploration,
leave `VITE_API_BASE_URL` empty and set `VITE_MOCK_MODE=true`. For a real
deployment, set `VITE_API_BASE_URL` and `VITE_MOCK_MODE=false`. With no API URL
configured, the app falls back to mock mode, and the default baked into the
source is `http://localhost:8000`.

## API contract

The dashboard calls these endpoint groups:

- `/v1/auth/*` for login, token refresh, registration, verification, and
  password reset
- `/v1/user/*` for profile, logout, 2FA, notifications, and blocklist
- `/v1/dmarc/reports` for report lists, report detail, records, XML, and
  deletion
- `/v1/dmarc/domains` for domain lists and domain detail
- `/v1/user/dashboard` for aggregate dashboard statistics

Authentication uses bearer tokens stored in browser local storage. The frontend
automatically attempts token refresh on `401` responses.

## Production

For a full DMARCo installation, including the backend and the inbound mail
gateway, use [`dmarcoapp/dmarcoapp`](https://github.com/dmarcoapp/dmarcoapp). It
ships a ready-made Docker Compose stack and an installer.

To run only the dashboard, use the published image:

```bash
docker run -d \
  --name dmarco-dashboard \
  -p 8081:80 \
  -e DMARCO_API_BASE_URL=https://api.example.com \
  ghcr.io/dmarcoapp/dashboard:latest
```

The image serves the built single-page app with nginx on port `80`. Put a
reverse proxy such as Caddy, nginx, Traefik, or your platform load balancer in
front of it for public HTTPS hosting.

Images are published to `ghcr.io/dmarcoapp/dashboard` on every GitHub release,
tagged with the release version and `latest`.

To build the production image locally instead, configure `.env` and use the
production Compose file:

```bash
cp .env.local.example .env
nano .env
docker compose --env-file .env -f compose.prod.yaml up --build -d
docker compose --env-file .env -f compose.prod.yaml ps
```

## Development

Useful commands:

```bash
npm run dev
npm run build
npm run build:dev
npm run lint
npm run preview
```

Before opening a pull request, run what CI runs:

```bash
npm run lint
npm run build
```

### Containerized development

The development Compose file builds the `development` target from the local
Dockerfile and mounts the working tree into the container:

```bash
cp .env.local.example .env
docker compose up --build app
```

The app is exposed on `http://127.0.0.1:5173`. Use this mode when you want a
containerized Vite dev server with hot reload.

Coding standards and UI conventions are in [`AGENTS.md`](AGENTS.md), and the
contribution guide is in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Related projects

- [`dmarcoapp/dmarcoapp`](https://github.com/dmarcoapp/dmarcoapp): ready-made
  Docker Compose stack and installer for the full application
- [`dmarcoapp/backend`](https://github.com/dmarcoapp/backend): API, workers, and
  report processing pipeline
- [`dmarcoapp/mail-inbound`](https://github.com/dmarcoapp/mail-inbound):
  self-hostable inbound mail gateway for DMARC aggregate reports

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE) and
[`NOTICE`](NOTICE).
