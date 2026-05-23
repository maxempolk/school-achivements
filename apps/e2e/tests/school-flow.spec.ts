import { expect, test, type Page } from '@playwright/test';

import { login, logout } from '../helpers/auth';
import { createSchoolFlowData } from '../helpers/test-data';

async function chooseOption(page: Page, testId: string, optionName: string) {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: optionName }).click();
}

async function waitForCreateResponse(page: Page, resource: string) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/api/backend/${resource}`),
  );
}

async function createClass(page: Page, className: string) {
  await page.goto('/admin/classes');
  await page.getByTestId('create-class-button').click();
  await page.getByTestId('class-name-input').fill(className);
  const responsePromise = waitForCreateResponse(page, 'classes');

  await page.getByTestId('save-class-button').click();

  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  await expect(page.getByText('Class created')).toBeVisible();
}

async function createSubject(page: Page, name: string, shortName: string) {
  await page.goto('/admin/subjects');
  await page.getByTestId('create-subject-button').click();
  await page.getByTestId('subject-name-input').fill(name);
  await page.getByTestId('subject-short-name-input').fill(shortName);
  const responsePromise = waitForCreateResponse(page, 'subjects');

  await page.getByTestId('save-subject-button').click();

  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  await expect(page.getByText('Subject created')).toBeVisible();
}

async function createUser(
  page: Page,
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  },
  role: 'TEACHER' | 'STUDENT',
  className?: string,
) {
  await page.goto('/admin/users');
  await page.getByTestId('create-user-button').click();
  await page.getByTestId('user-email-input').fill(user.email);
  await page.getByTestId('user-password-input').fill(user.password);
  await chooseOption(page, 'user-role-select', role);
  await page.getByTestId('profile-first-name-input').fill(user.firstName);
  await page.getByTestId('profile-last-name-input').fill(user.lastName);

  if (role === 'STUDENT' && className) {
    await chooseOption(page, 'profile-class-select', className);
  }

  const responsePromise = waitForCreateResponse(page, 'users');

  await page.getByTestId('save-user-button').click();

  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  await expect(page.getByText('User created')).toBeVisible();
}

async function createLesson(
  page: Page,
  className: string,
  subjectName: string,
  topic: string,
  homework: string,
) {
  await page.goto('/teacher/lessons');
  await page.getByTestId('create-lesson-button').click();
  await chooseOption(page, 'lesson-class-select', className);
  await chooseOption(page, 'lesson-subject-select', subjectName);
  await page.getByTestId('lesson-date-input').fill('2030-01-01T09:00');
  await page.getByTestId('lesson-topic-input').fill(topic);
  await page.getByTestId('lesson-homework-input').fill(homework);
  await page.getByTestId('save-lesson-button').click();
  await expect(page.getByText(topic)).toBeVisible();
}

test('admin creates school data, teacher grades lesson, student sees grade', async ({
  page,
}) => {
  const data = createSchoolFlowData();

  await login(page, { ...data.admin, redirectTo: '/admin/classes' });
  await createClass(page, data.className);
  await createSubject(
    page,
    data.lesson.subjectName,
    data.lesson.subjectShortName,
  );
  await createUser(page, data.teacher, 'TEACHER');
  await createUser(page, data.student, 'STUDENT', data.className);
  await logout(page);

  await login(page, {
    email: data.teacher.email,
    password: data.teacher.password,
    redirectTo: '/teacher/lessons',
  });
  await createLesson(
    page,
    data.className,
    data.lesson.subjectName,
    data.lesson.topic,
    data.lesson.homework,
  );
  await page.getByRole('link', { name: 'Open' }).last().click();
  await expect(
    page.getByText(`${data.student.lastName} ${data.student.firstName}`),
  ).toBeVisible();

  const studentRow = page
    .getByRole('row')
    .filter({ hasText: `${data.student.lastName} ${data.student.firstName}` });

  await studentRow.getByRole('spinbutton').fill(data.lesson.grade);
  await studentRow.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Grade saved')).toBeVisible();
  await logout(page);

  await login(page, {
    email: data.student.email,
    password: data.student.password,
    redirectTo: '/student/grades',
  });

  await expect(page.getByText(data.lesson.topic)).toBeVisible();
  await expect(
    page.getByRole('cell', { name: data.lesson.grade }),
  ).toBeVisible();
});
