# dmarcoapp/dashboard

Open source, self-hostable dashboard for DMARC monitoring.

It gives domain owners a web UI for reviewing DMARC aggregate reports, sender alignment, policy outcomes, suspicious traffic, and domain protection status. The dashboard can run with mock data for local exploration, or connect to a Dmarco-compatible API for real deployments.

## Overview

```text
Browser -> Dashboard UI -> Dmarco API -> DMARC reports
```

This repository contains the frontend application:

- React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- nginx production image for serving the built single-page app
- Docker Compose files for local development and production-style hosting
- mock mode for trying the UI without a backend

The dashboard expects a backend API that exposes the `/v1` endpoints used by the app. For inbound report collection, see [`dmarcoapp/mail-inbound`](https://github.com/dmarcoapp/mail-inbound).

## Features

- DMARC dashboard with report count, message volume, pass rate, blocked threats, and trend cards
- report browsing with filtering, sorting, pagination, XML preview, record details, and bulk deletion
- domain inventory with protection level indicators
- sender, offender, reporting organization, and country distribution views
- user blocklist management
- authentication screens, registration flow, email verification, password reset, profile, 2FA, and notifications
- responsive UI for desktop and mobile

## Get Started

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

The Vite dev server prints the local URL, usually `http://localhost:5173`.

## Docker Development

The development Compose file builds the `development` target from the local Dockerfile and mounts the working tree into the container:

```bash
cp .env.local.example .env
docker compose up --build app
```

The app is exposed on:

```text
http://127.0.0.1:5173
```

Use this mode when you want a containerized Vite dev server with hot reload.

## Production Hosting

For a production-style self-hosted deployment, configure `.env` or `.env.local` and start the production Compose file:

```bash
cp .env.local.example .env
nano .env
docker compose -f compose.prod.yaml up --build -d
docker compose -f compose.prod.yaml ps
```

The production image builds static assets and serves them with nginx on:

```text
http://127.0.0.1:8081
```

Put a reverse proxy such as Caddy, nginx, Traefik, or your platform load balancer in front of it for public HTTPS hosting.

## Configuration

The app is configured at build/runtime through Vite environment variables:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_DISABLE_REGISTRATION=false
VITE_MOCK_MODE=false
```

Common settings:

- `VITE_API_BASE_URL`: base URL of the Dmarco-compatible backend API
- `VITE_DISABLE_REGISTRATION`: set to `true` to hide public registration
- `VITE_MOCK_MODE`: set to `true` to use bundled mock data, or `false` to call the real API

If `VITE_API_BASE_URL` is not set, the app falls back to mock mode. The default API URL in source is `http://localhost:8000`.

## API Contract

The dashboard calls these endpoint groups:

- `/v1/auth/*` for login, token refresh, registration, verification, and password reset
- `/v1/user/*` for profile, logout, 2FA, notifications, and blocklist
- `/v1/dmarc/reports` for report lists, report detail, records, XML, and deletion
- `/v1/dmarc/domains` for domain lists and domain detail
- `/v1/user/dashboard` for aggregate dashboard statistics

Authentication uses bearer tokens stored in browser local storage. The frontend automatically attempts token refresh on `401` responses.

## Development

Useful commands:

```bash
npm run dev
npm run build
npm run build:dev
npm run lint
npm run preview
```

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

## Related Projects

- [`dmarcoapp/mail-inbound`](https://github.com/dmarcoapp/mail-inbound): self-hostable inbound mail gateway for DMARC aggregate reports

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).
