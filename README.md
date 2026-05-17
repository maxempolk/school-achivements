# School Achievements

[![Live Demo](https://img.shields.io/badge/live%20demo-open%20app-2ea44f?style=for-the-badge)](https://school-achivements-web.vercel.app)

School Achievements is a full-stack school management application for tracking users and achievement-related workflows. The project is built as a monorepo with a Next.js frontend, NestJS backend, shared validation/types package, and PostgreSQL database access through Prisma.

## Demo Account

Use this account to try the deployed app:

```text
Email: admin@test.com
Password: admin123
```

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

## Environment Variables

Backend:

```env
DATABASE_URL=
FRONTEND_URL=http://localhost:3001
```

Frontend:

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
