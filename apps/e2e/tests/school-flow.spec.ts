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

  return (await response.json()) as { id: number; name: string };
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

  return (await response.json()) as { id: number; name: string };
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

  return (await response.json()) as {
    id: number;
    teacher: {
      id: number;
    } | null;
  };
}

async function getUser(page: Page, userId: number) {
  const response = await page.request.get(`/api/backend/users/${userId}`);

  expect(response.ok()).toBeTruthy();

  return (await response.json()) as {
    id: number;
    teacher: {
      id: number;
    } | null;
  };
}

async function createClassroom(
  page: Page,
  classroom: {
    number: string;
    building: string;
    capacity: number;
  },
) {
  const response = await page.request.post('/api/backend/classrooms', {
    data: classroom,
  });

  expect(response.ok()).toBeTruthy();

  return (await response.json()) as { id: number };
}

async function assignTeacher(
  page: Page,
  teacherId: number,
  classId: number,
  subjectId: number,
) {
  const response = await page.request.put(
    `/api/backend/teachers/${teacherId}/assignments`,
    {
      data: {
        classIds: [classId],
        subjectIds: [subjectId],
      },
    },
  );

  expect(response.ok()).toBeTruthy();
}

async function createScheduleSlot(
  page: Page,
  ids: {
    classId: number;
    subjectId: number;
    teacherId: number;
    classroomId: number;
  },
) {
  const response = await page.request.post('/api/backend/schedule-slots', {
    data: {
      ...ids,
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '09:45',
      weekType: 'EVERY',
    },
  });

  expect(response.ok()).toBeTruthy();
}

async function startScheduledLesson(
  page: Page,
  topic: string,
  homework: string,
) {
  await page.goto('/teacher/schedule');
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page).toHaveURL(/\/teacher\/lessons\/\d+$/);
  await page.getByLabel('Topic').fill(topic);
  await page.getByLabel('Homework').fill(homework);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText('Lesson updated')).toBeVisible();
  await expect(page.getByDisplayValue(topic)).toBeVisible();
}

test('admin creates school data, teacher grades lesson, student sees grade', async ({
  page,
}) => {
  const data = createSchoolFlowData();

  await login(page, { ...data.admin, redirectTo: '/admin/classes' });
  const schoolClass = await createClass(page, data.className);
  const subject = await createSubject(
    page,
    data.lesson.subjectName,
    data.lesson.subjectShortName,
  );
  const teacherUser = await createUser(page, data.teacher, 'TEACHER');
  await createUser(page, data.student, 'STUDENT', data.className);
  const classroom = await createClassroom(page, data.classroom);
  const teacher = await getUser(page, teacherUser.id);

  expect(teacher.teacher).not.toBeNull();
  await assignTeacher(page, teacher.teacher!.id, schoolClass.id, subject.id);
  await createScheduleSlot(page, {
    classId: schoolClass.id,
    subjectId: subject.id,
    teacherId: teacher.teacher!.id,
    classroomId: classroom.id,
  });
  await logout(page);

  await login(page, {
    email: data.teacher.email,
    password: data.teacher.password,
    redirectTo: '/teacher/schedule',
  });
  await startScheduledLesson(page, data.lesson.topic, data.lesson.homework);
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
