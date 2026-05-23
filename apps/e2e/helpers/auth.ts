import { expect, type Page } from '@playwright/test';

export async function login(
  page: Page,
  credentials: {
    email: string;
    password: string;
    redirectTo?: string;
  },
) {
  const loginPath = credentials.redirectTo
    ? `/login?redirect=${encodeURIComponent(credentials.redirectTo)}`
    : '/login';

  await page.goto(loginPath);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  if (credentials.redirectTo) {
    await expect(page).toHaveURL(new RegExp(`${credentials.redirectTo}$`));
  } else {
    await expect(page).not.toHaveURL(/\/login/);
  }
}

export async function logout(page: Page) {
  await page
    .getByRole('button', { name: /admin menu|teacher|student/i })
    .click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
}
