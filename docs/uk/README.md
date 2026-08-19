# School Achievements

[English documentation](../../README.md)

School Achievements — full-stack застосунок для керування школою та роботи з
користувачами, навчальними даними й пов'язаними процесами. Проєкт побудований
як монорепозиторій: Next.js frontend, NestJS backend, спільний пакет валідації
та типів і PostgreSQL через Prisma.

## Демо-акаунти

Усі демо-акаунти використовують пароль `admin123`.

| Email                                 | Роль                               |
| ------------------------------------- | ---------------------------------- |
| admin@test.com                        | Адміністратор                      |
| teacher1@test.com                     | Вчитель (Математика)               |
| teacher2@test.com                     | Вчитель (Українська мова, Історія) |
| student1@test.com … student5@test.com | Учні                               |
| parent1@test.com                      | Батьки                             |

Ці акаунти заповнені тестовими даними для публічного демо. Не використовуйте
ці облікові дані в реальному розгортанні.

> Примітка: демо працює на безкоштовних тарифах хостингу, тому після періоду
> неактивності backend може відповідати до хвилини, поки «прогрівається».
> Демо-база автоматично скидається до початкового стану щоночі, тому будь-які
> внесені зміни є тимчасовими.

## Технології

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, Passport JWT, Prisma
- **База даних:** PostgreSQL
- **Спільний пакет:** Zod-схеми та TypeScript-типи
- **Розгортання:** Vercel для web, Render для API, Neon для PostgreSQL

## Структура проєкту

```text
apps/
  api/          NestJS API
  web/          Next.js frontend
packages/
  shared-types/ Спільні схеми й типи
```

## Автентифікація

Автентифікація використовує same-origin Next.js proxy, щоб уникнути проблем із
cross-site cookies між Vercel і Render.

- Запит входу: `/api/auth/login`
- Proxy до захищеного backend: `/api/backend/[...path]`
- Cookie автентифікації: `access_token`, `HttpOnly`

Клієнтський код має звертатися до захищених API-маршрутів через Next.js proxy:

```ts
innerApi.get('/api/backend/users/me');
```

## Локальний запуск

Встановіть залежності:

```bash
pnpm install
```

Створіть локальні файли середовища з безпечних шаблонів:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

Запустіть локальну інфраструктуру:

```bash
pnpm infra
```

Запустіть проєкт у режимі розробки:

```bash
pnpm dev
```

Корисні команди:

```bash
pnpm lint
pnpm build
pnpm --filter api db:seed
```

API доступне за адресою `http://localhost:3000`, інтерактивна OpenAPI
документація — за адресою `http://localhost:3000/api/docs`, а `GET /health`
призначений для health check після розгортання.

## Змінні середовища

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

У production `API_URL` має вказувати на Render API, а `FRONTEND_URL` — на
розгорнутий Vercel frontend.

## Розгортання

- Frontend розгорнуто на Vercel: https://school-achivements-web.vercel.app
- Backend розгорнуто на Render (безкоштовний тариф).

Перед розгортанням виконайте:

```bash
pnpm lint
pnpm build
```

CI перевіряє встановлення залежностей, генерацію Prisma Client, linting,
unit-тести та production build для кожного pull request.
