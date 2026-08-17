# School Achievements

[![Live Demo](https://img.shields.io/badge/live%20demo-open%20app-2ea44f?style=for-the-badge)](https://school-achivements-web.vercel.app)
[![CI](https://github.com/maxempolk/school-achivements/actions/workflows/ci.yml/badge.svg)](https://github.com/maxempolk/school-achivements/actions/workflows/ci.yml)

School Achievements is a full-stack school management application for tracking users and achievement-related workflows. The project is built as a monorepo with a Next.js frontend, NestJS backend, shared validation/types package, and PostgreSQL database access through Prisma.

## Demo Account

Use this account to explore the deployed demonstration only:

```text
Email: admin@test.com
Password: admin123
```

The account is seeded for a public demo. Do not reuse these credentials in a
real deployment.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, Passport JWT, Prisma
- **Database:** PostgreSQL
- **Shared package:** Zod schemas and shared TypeScript types
- **Deployment:** Vercel for web, Railway for API

## Project Structure

```text
apps/
  api/          NestJS API
  web/          Next.js frontend
packages/
  shared-types/ Shared schemas and types
```

## Authentication

Authentication uses a same-origin Next.js proxy to avoid cross-site cookie issues between Vercel and Railway.

- Login request: `/api/auth/login`
- Protected backend proxy: `/api/backend/[...path]`
- Auth cookie: `access_token`, `HttpOnly`

Client code should call protected API routes through the Next.js proxy, for example:

```ts
innerApi.get('/api/backend/users/me');
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create local environment files from the safe templates:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Start local infrastructure:

```bash
pnpm infra
```

Run the project in development:

```bash
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm build
pnpm --filter api db:seed
```

The API is available at `http://localhost:3000`, its interactive OpenAPI docs
are at `http://localhost:3000/api/docs`, and `GET /health` is suitable for a
deployment health check.

## Environment Variables

Backend (`apps/api/.env`):

```env
DATABASE_URL=
FRONTEND_URL=http://localhost:3001
```

Frontend (`apps/web/.env.local`):

```env
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

In production, `API_URL` should point to the Railway API URL and `FRONTEND_URL` should point to the deployed Vercel frontend.

## Deployment

- Frontend is deployed on Vercel: https://school-achivements-web.vercel.app
- Backend is deployed on Railway.

Before deploying, run:

```bash
pnpm lint
pnpm build
```

The CI workflow validates installation, Prisma client generation, linting,
unit tests and production builds on every pull request.
