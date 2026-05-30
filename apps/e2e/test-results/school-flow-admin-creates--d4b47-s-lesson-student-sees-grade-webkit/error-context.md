# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: school-flow.spec.ts >> admin creates school data, teacher grades lesson, student sees grade
- Location: tests/school-flow.spec.ts:171:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin\/classes$/
Received string:  "http://localhost:3001/login?redirect=%2Fadmin%2Fclasses"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    24 × unexpected value "http://localhost:3001/login?redirect=%2Fadmin%2Fclasses"

```

```yaml
- main:
    - text: Login Enter your credentials to continue. Email
    - textbox "Email":
        - /placeholder: you@example.com
    - text: Password
    - textbox "Password":
        - /placeholder: Enter your password
        - text: admin123
    - button "Sign in"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  |
  3  | export async function login(
  4  |   page: Page,
  5  |   credentials: {
  6  |     email: string;
  7  |     password: string;
  8  |     redirectTo?: string;
  9  |   },
  10 | ) {
  11 |   const loginPath = credentials.redirectTo
  12 |     ? `/login?redirect=${encodeURIComponent(credentials.redirectTo)}`
  13 |     : '/login';
  14 |
  15 |   await page.goto(loginPath);
  16 |   await page.getByLabel('Email').fill(credentials.email);
  17 |   await page.getByLabel('Password').fill(credentials.password);
  18 |   await page.getByRole('button', { name: 'Sign in' }).click();
  19 |
  20 |   if (credentials.redirectTo) {
> 21 |     await expect(page).toHaveURL(new RegExp(`${credentials.redirectTo}$`));
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  22 |   } else {
  23 |     await expect(page).not.toHaveURL(/\/login/);
  24 |   }
  25 | }
  26 |
  27 | export async function logout(page: Page) {
  28 |   await page
  29 |     .getByRole('button', { name: /admin menu|teacher|student/i })
  30 |     .click();
  31 |   await page.getByRole('menuitem', { name: 'Sign out' }).click();
  32 |   await expect(page).toHaveURL(/\/login/);
  33 | }
  34 |
```
