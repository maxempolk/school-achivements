# School Achievements

Full-stack school management app with role-based workflows for administrators, teachers, students and parents.

[Live Demo](https://school-achivements-web.vercel.app) · [Source](https://github.com/maxempolk/school-achivements) · [Українська документація](docs/uk/README.md)

[![CI](https://github.com/maxempolk/school-achivements/actions/workflows/ci.yml/badge.svg)](https://github.com/maxempolk/school-achivements/actions/workflows/ci.yml)

## About

School Achievements brings school administration and classroom work into one application. Administrators set up users, classes and subjects; teachers manage lessons and grades; students can view their results. The monorepo connects a Next.js frontend to a NestJS API and a PostgreSQL database.

## Highlights

- Role-based flows for administrators, teachers, students and parents.
- School setup, teacher assignments, schedules, lessons and grades, including an end-to-end Playwright flow from administration to a student's grade view.
- Shared Zod schemas and TypeScript types across the frontend and API.
- Same-origin API proxy and `HttpOnly` authentication cookie; CI covers linting, tests and production builds.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, Passport JWT, Prisma
- **Database:** PostgreSQL
- **Shared package:** Zod schemas and shared TypeScript types
- **Testing and deployment:** Playwright, CI, Vercel, Render, Neon

## Live Demo

Open the [public demo](https://school-achivements-web.vercel.app). The backend may take up to a minute to wake after inactivity. Demo data resets nightly, so changes are temporary.

### Demo accounts

All demo accounts use the password `admin123`.

| Email                                 | Role                                  |
| ------------------------------------- | ------------------------------------- |
| admin@test.com                        | Admin                                 |
| teacher1@test.com                     | Teacher (Mathematics)                 |
| teacher2@test.com                     | Teacher (Ukrainian Language, History) |
| student1@test.com … student5@test.com | Students                              |
| parent1@test.com                      | Parent                                |

These accounts are seeded for a public demo. Do not reuse these credentials in
a real deployment.

## Project Structure

```text
apps/
  api/          NestJS API
  web/          Next.js frontend
packages/
  shared-types/ Shared schemas and types
```

## Authentication

Authentication uses a same-origin Next.js proxy to avoid cross-site cookie issues between Vercel and Render.

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

In production, `API_URL` should point to the Render API URL and `FRONTEND_URL` should point to the deployed Vercel frontend.

## Deployment

- Frontend is deployed on Vercel: https://school-achivements-web.vercel.app
- Backend is deployed on Render (free tier).

Before deploying, run:

```bash
pnpm lint
pnpm build
```

The CI workflow validates installation, Prisma client generation, linting,
unit tests and production builds on every pull request.
