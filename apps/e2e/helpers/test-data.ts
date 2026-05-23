export const defaultPassword = 'admin123';

export function createSchoolFlowData() {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    admin: {
      email: 'admin@test.com',
      password: defaultPassword,
    },
    className: `E2E Class ${runId}`,
    teacher: {
      email: `teacher-e2e-${runId}@test.com`,
      password: defaultPassword,
      firstName: 'E2E',
      lastName: 'Teacher',
    },
    student: {
      email: `student-e2e-${runId}@test.com`,
      password: defaultPassword,
      firstName: 'E2E',
      lastName: 'Student',
    },
    lesson: {
      subjectName: `E2E Subject ${runId}`,
      subjectShortName: 'E2E',
      topic: `E2E Topic ${runId}`,
      homework: `E2E Homework ${runId}`,
      grade: '12',
    },
  };
}
