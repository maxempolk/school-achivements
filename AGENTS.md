# AGENTS.md

## Project Overview

- School Achievements is a full-stack school management MVP.
- It helps manage school users, classes, subjects, classrooms, schedules, lessons, grades, attendance, and parent/student views.
- Main users: admins, teachers, students, and parents.
- Current MVP scope appears to include:
  - role-based auth;
  - admin CRUD for core school data;
  - schedule-based lesson creation for teachers;
  - grade and attendance tracking;
  - student and parent read-only progress views.

## Tech Stack

- Monorepo: `apps/*` and `packages/*` managed with pnpm workspaces and Turborepo.
- Package manager: `pnpm@11.1.1`.
- Backend: NestJS, TypeScript, Passport JWT, Swagger.
- Frontend: Next.js App Router, React 19, TypeScript.
- Database: PostgreSQL via Docker Compose for local infra.
- ORM: Prisma 7 with Prisma migrations and `@prisma/adapter-pg`.
- Authentication: JWT access tokens plus refresh token sessions; Next.js same-origin API proxy stores auth cookies.
- Validation: shared Zod v4 schemas in `@school/shared-types`, consumed by NestJS DTOs through `nestjs-zod` and by React Hook Form through `standardSchemaResolver`.
- UI/components: Tailwind CSS v4, shadcn-style components, Radix UI, lucide-react icons, sonner toasts.
- Data fetching: TanStack Query and Axios.
- Testing: Jest for API unit/e2e scaffolding; Playwright WebKit e2e app tests.
- Deployment visible in docs: Vercel for web, Railway for API.

## Repository Structure

- `apps/api`: NestJS backend application.
  - `src/*`: feature modules with controller/service/dto structure.
  - `prisma/schema.prisma`: current database schema.
  - `prisma/migrations`: Prisma SQL migrations.
  - `prisma/seed.ts`: seed data.
  - `prisma.config.ts`: Prisma config, migrations path, seed command, datasource.
  - `test`: Nest e2e test scaffold.
- `apps/web`: Next.js frontend application.
  - `app`: App Router routes for auth proxy, admin, teacher, student, parent, dashboard, login.
  - `components`: feature components and local UI primitives.
  - `lib/api.ts`: Axios clients and 401 redirect handling.
  - `middleware.ts`: cookie-based protection for app sections.
- `apps/e2e`: Playwright e2e tests and helpers.
- `packages/shared-types`: shared Zod schemas and inferred TypeScript types.
- Root config: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `docker-compose.yml`.
- Docs: root `README.md`, app READMEs, and `apps/api/prisma/finish_schema` as a reference/target schema. `finish_schema` is not the active Prisma schema.

## Implemented Features

- Auth
  - Login, refresh, logout in API.
  - Access token and refresh token sessions.
  - HttpOnly cookies set by Next.js auth routes.
  - Backend guards: `JwtAuthGuard`, `RolesGuard`, `@Roles`.
- Admin
  - CRUD screens for users, classes, subjects, classrooms, and schedule slots.
  - User creation creates teacher/student/parent profiles when applicable.
  - Parent-child linking through `ParentStudent`.
  - Teacher assignment management through `TeacherClass` and `TeacherSubject`.
- Teacher
  - Teacher schedule view.
  - Start/open lesson from a schedule slot.
  - Lesson list and lesson detail view.
  - Edit own lesson topic/homework.
  - Grade students on own lessons.
  - Mark attendance on own lessons.
  - Teacher-facing class, subject, and student lists are filtered by assignments.
- Student
  - Student grades page.
  - Student weekly schedule page.
  - Student attendance page with statistics.
- Parent
  - Parent layout with child selector.
  - Parent can view linked child grades, schedule, and attendance statistics.
- Lessons
  - Admin-only generic `POST /lessons`.
  - Teacher-only `POST /lessons/from-schedule-slot`.
  - Teacher access limited to own lessons.
  - `Lesson` can reference a `ScheduleSlot`; `@@unique([scheduleSlotId, date])`.
- Schedule
  - Schedule slots include class, subject, teacher, classroom, day, time, and week type.
  - Conflict checks for teacher/class/classroom time collisions.
  - Schedule slot creation/update validates teacher class/subject assignments.
- Grades and Attendance
  - Grades unique per lesson/student.
  - Attendance unique per lesson/student.
  - Teacher can write only for own lesson.
  - Student/parent read views are available.
- Testing/deployment
  - API Jest scaffold exists.
  - Playwright e2e flow exists, but parts may be stale relative to current lesson API/UI.
  - README documents Vercel/Railway deployment.

## Data Model Summary

- Enums:
  - `Role`: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.
  - `DayOfWeek`: Monday through Sunday.
  - `WeekType`: `ODD`, `EVEN`, `EVERY`.
- `User`
  - Unique `email`, `password`, `role`.
  - Optional one-to-one profiles: `Teacher`, `Student`, `Parent`.
  - Has many `RefreshTokenSession`.
- `Teacher`
  - Unique `userId`.
  - Has many `Lesson`, `ScheduleSlot`, `TeacherClass`, `TeacherSubject`.
- `Student`
  - Unique `userId`, belongs to `Class`.
  - Has many `Grade`, `Attendance`, `ParentStudent`.
- `Parent`
  - Unique `userId`, has many `ParentStudent`.
- `ParentStudent`
  - M:N between parent and student.
  - Composite primary key `@@id([parentId, studentId])`.
- `Class`
  - Has students, lessons, schedule slots, teacher assignments.
- `Subject`
  - Has lessons, schedule slots, teacher assignments.
- `TeacherClass`
  - M:N between teacher and class.
  - Composite primary key `@@id([teacherId, classId])`.
- `TeacherSubject`
  - M:N between teacher and subject.
  - Composite primary key `@@id([teacherId, subjectId])`.
- `Classroom`
  - Unique `@@unique([number, building])`.
  - Used by lessons and schedule slots.
- `ScheduleSlot`
  - Links class, subject, teacher, classroom.
  - Unique constraints prevent same class/teacher/classroom at the same day/start/week.
  - Indexed by class/day, teacher/day, classroom/day.
- `Lesson`
  - Links teacher, class, subject, optional classroom, optional schedule slot.
  - Unique `@@unique([scheduleSlotId, date])`.
- `Grade`
  - Links lesson/student with unique `@@unique([lessonId, studentId])`.
- `Attendance`
  - Links lesson/student with unique `@@unique([lessonId, studentId])`.

## API and Frontend Patterns

- Backend
  - Feature folders follow `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*`.
  - Controllers declare guards and role checks; services hold domain validation and Prisma access.
  - DTOs are generated with `createZodDto` from shared Zod schemas.
  - Global `ZodValidationPipe` is configured in `main.ts`.
  - Swagger is available at `/api/docs`.
- Auth and permissions
  - Backend role checks are the main permission boundary.
  - Frontend `middleware.ts` protects app sections by auth cookies; frontend role enforcement beyond auth is not detected.
- Frontend
  - App Router pages are grouped by role: `/admin`, `/teacher`, `/student`, `/parent`.
  - Client components use TanStack Query for loading and cache invalidation.
  - Forms use React Hook Form with shared Zod schemas.
  - API calls use `innerApi` through `/api/backend/...`.
  - Auth calls use `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.
  - Operation success/failure is shown through sonner toasts.
  - Field-level validation errors are shown inside forms.

## Architecture Decisions

- Shared Zod schemas are the source for API DTO validation and frontend form validation.
- Protected frontend requests go through the Next.js same-origin proxy to avoid cross-site cookie issues.
- Access and refresh tokens are stored as HttpOnly cookies by the web app.
- Backend role checks are implemented with `@Roles`, `JwtAuthGuard`, and `RolesGuard`.
- Schedule slots are the source for normal teacher lesson creation.
- Admin can create a lesson directly; teachers start lessons from their assigned schedule slots.
- Schedule conflict validation happens before creating or updating a slot.
- Teacher-class and teacher-subject assignments limit teacher-visible data and validate schedule-slot combinations.
- Parent access is read-only and limited to children linked through `ParentStudent`.
- Form validation errors should be rendered on the form; action results and general API errors should use toasts.

## Current Development State

- Active repository TODOs indicate ongoing cleanup:
  - duplicate authenticated user helper types in API services;
  - duplicated `findOneForAdmin` and parse helpers;
  - stricter production CORS;
  - incomplete frontend middleware TODO;
  - possible shared layout/sidebar refactor for role workspaces.
- `apps/web/components/teacher/lesson-form-dialog.tsx` exists but is not used by the current teacher lessons page; it posts to `POST /lessons`, which is currently admin-only. Treat as potentially stale.
- `apps/e2e/tests/school-flow.spec.ts` appears to expect direct teacher lesson creation and may be stale relative to current schedule-slot lesson flow.
- `apps/api/prisma/finish_schema` looks like a target/reference schema, not the active schema.

## Commands

- Install:
  - `pnpm install`
- Local infrastructure:
  - `pnpm infra`
  - `pnpm infra:down`
- Development:
  - `pnpm dev`
  - `pnpm dev:api`
  - `pnpm dev:web`
  - `pnpm --filter @school/shared-types dev`
- Build:
  - `pnpm build`
  - `pnpm --filter @school/shared-types build`
  - `pnpm --filter api build`
  - `pnpm --filter web build`
- Lint/format:
  - `pnpm lint`
  - `pnpm --filter api lint`
  - `pnpm --filter web lint`
  - `pnpm format`
- Tests:
  - `pnpm test`
  - `pnpm --filter api test`
  - `pnpm --filter api test:e2e`
  - `pnpm --filter e2e test:e2e`
  - `pnpm --filter e2e test:e2e:headed`
  - `pnpm --filter e2e test:e2e:debug`
  - `pnpm --filter e2e test:e2e:list`
- Prisma:
  - `pnpm --filter api db:generate`
  - `pnpm --filter api db:migrate:dev`
  - `pnpm --filter api db:migrate:deploy`
  - `pnpm --filter api db:push`
  - `pnpm --filter api db:seed`

## Development Rules for AI Agents

1. Before starting a task, read this `AGENTS.md` file.
2. Inspect existing code patterns before changing files.
3. Prefer small, focused changes over large rewrites.
4. Reuse existing architecture, naming, validation, and UI patterns.
5. Do not introduce a new library, framework, or architectural layer unless clearly necessary.
6. Do not remove existing functionality unless the task explicitly requires it.
7. Do not include secrets, tokens, passwords, or private credentials.
8. After making meaningful changes, update this `AGENTS.md` file if the project context changed.
9. When adding new frontend routes/pages, also add the route to the development navigation on `apps/web/app/page.tsx`.

## AGENTS.md Update Policy

“Whenever you make a meaningful change to the project, update `AGENTS.md` in the same change set if the change affects project context.

Update this file when:

- a new feature is added;
- a major file/folder is added or removed;
- Prisma models, relations, enums, indexes, or migrations change;
- API endpoints change;
- frontend routes/pages/components change significantly;
- validation rules change;
- auth/roles/permissions change;
- testing/deployment commands change;
- an architecture decision changes.

Do not update this file for:

- tiny refactors;
- formatting-only changes;
- typo fixes;
- temporary debugging;
- implementation details that do not help future agents.

Keep updates concise and factual. Do not rewrite the whole file unless the structure is outdated.”
