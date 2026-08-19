import { PrismaPg } from '@prisma/adapter-pg';
import {
  DayOfWeek,
  GradeAuditAction,
  NotificationType,
  PrismaClient,
  Role,
  WeekType,
} from '@prisma/client';
import type {
  Class,
  Classroom,
  ScheduleSlot,
  Student,
  Subject,
  Teacher,
  User,
} from '@prisma/client';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config({ path: '.env' });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const defaultPassword = 'admin123';

async function upsertClass(name: string) {
  const existingClass = await prisma.class.findFirst({
    where: { name },
  });

  if (existingClass) {
    return prisma.class.update({
      where: { id: existingClass.id },
      data: { name },
    });
  }

  return prisma.class.create({
    data: { name },
  });
}

async function upsertSubject(name: string, shortName: string) {
  const existingSubject = await prisma.subject.findFirst({
    where: { name },
  });

  if (existingSubject) {
    return prisma.subject.update({
      where: { id: existingSubject.id },
      data: { name, shortName },
    });
  }

  return prisma.subject.create({
    data: { name, shortName },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.user.upsert({
    where: {
      email: 'admin@test.com',
    },
    update: {
      role: Role.ADMIN,
      isSuperAdmin: true,
    },
    create: {
      email: 'admin@test.com',
      password: passwordHash,
      role: Role.ADMIN,
      isSuperAdmin: true,
    },
  });

  const classEntity = await upsertClass('10-A');

  const [mathematics, ukrainianLanguage, history] = await Promise.all([
    upsertSubject('Mathematics', 'Math'),
    upsertSubject('Ukrainian Language', 'Ukr'),
    upsertSubject('History', 'Hist'),
  ]);

  const teachers = [
    {
      email: 'teacher1@test.com',
      firstName: 'Olena',
      lastName: 'Shevchenko',
    },
    {
      email: 'teacher2@test.com',
      firstName: 'Andrii',
      lastName: 'Kovalenko',
    },
  ];
  const seededTeachers: Teacher[] = [];

  for (const teacher of teachers) {
    const user = await prisma.user.upsert({
      where: {
        email: teacher.email,
      },
      update: {
        role: Role.TEACHER,
      },
      create: {
        email: teacher.email,
        password: passwordHash,
        role: Role.TEACHER,
      },
    });

    const teacherProfile = await prisma.teacher.upsert({
      where: {
        userId: user.id,
      },
      update: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      },
      create: {
        userId: user.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      },
    });

    seededTeachers.push(teacherProfile);
  }

  for (const teacher of seededTeachers) {
    await prisma.teacherClass.upsert({
      where: {
        teacherId_classId: {
          teacherId: teacher.id,
          classId: classEntity.id,
        },
      },
      update: {},
      create: {
        teacherId: teacher.id,
        classId: classEntity.id,
      },
    });
  }

  if (seededTeachers[0]) {
    await prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId: {
          teacherId: seededTeachers[0].id,
          subjectId: mathematics.id,
        },
      },
      update: {},
      create: {
        teacherId: seededTeachers[0].id,
        subjectId: mathematics.id,
      },
    });
  }

  if (seededTeachers[1]) {
    for (const subject of [ukrainianLanguage, history]) {
      await prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: seededTeachers[1].id,
            subjectId: subject.id,
          },
        },
        update: {},
        create: {
          teacherId: seededTeachers[1].id,
          subjectId: subject.id,
        },
      });
    }
  }

  const students = [
    {
      email: 'student1@test.com',
      firstName: 'Maksym',
      lastName: 'Bondarenko',
    },
    {
      email: 'student2@test.com',
      firstName: 'Sofia',
      lastName: 'Melnyk',
    },
    {
      email: 'student3@test.com',
      firstName: 'Danylo',
      lastName: 'Tkachenko',
    },
    {
      email: 'student4@test.com',
      firstName: 'Anastasiia',
      lastName: 'Kravchenko',
    },
    {
      email: 'student5@test.com',
      firstName: 'Artem',
      lastName: 'Lysenko',
    },
  ];
  const seededStudents: Student[] = [];

  for (const student of students) {
    const user = await prisma.user.upsert({
      where: {
        email: student.email,
      },
      update: {
        role: Role.STUDENT,
      },
      create: {
        email: student.email,
        password: passwordHash,
        role: Role.STUDENT,
      },
    });

    const studentProfile = await prisma.student.upsert({
      where: {
        userId: user.id,
      },
      update: {
        classId: classEntity.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      create: {
        userId: user.id,
        classId: classEntity.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
    });

    seededStudents.push(studentProfile);
  }

  const parentUser = await prisma.user.upsert({
    where: {
      email: 'parent1@test.com',
    },
    update: {
      role: Role.PARENT,
    },
    create: {
      email: 'parent1@test.com',
      password: passwordHash,
      role: Role.PARENT,
    },
  });

  const parent = await prisma.parent.upsert({
    where: {
      userId: parentUser.id,
    },
    update: {},
    create: {
      userId: parentUser.id,
    },
  });

  await prisma.parentStudent.deleteMany({
    where: {
      parentId: parent.id,
    },
  });

  await prisma.parentStudent.createMany({
    data: seededStudents.slice(0, 2).map((student) => ({
      parentId: parent.id,
      studentId: student.id,
    })),
  });

  await seedDemoData({
    classEntity,
    mathematics,
    ukrainianLanguage,
    history,
    teachers: seededTeachers,
    students: seededStudents,
    parentUser,
  });

  console.log('Seed completed');
  console.log(`Default password for seeded users: ${defaultPassword}`);
}

type DemoContext = {
  classEntity: Class;
  mathematics: Subject;
  ukrainianLanguage: Subject;
  history: Subject;
  teachers: Teacher[];
  students: Student[];
  parentUser: User;
};

type SlotDefinition = {
  dayOfWeek: DayOfWeek;
  start: [number, number];
  end: [number, number];
  subject: Subject;
  teacher: Teacher;
  classroom: Classroom;
};

type LessonDefinition = {
  slotIndex: number;
  daysAgo: number;
  topic: string;
  homework?: string;
};

// Schedule slots store only the time of day on a fixed epoch date,
// matching schedule-slots.service.ts parseTime().
function slotTime(hours: number, minutes = 0) {
  return new Date(1970, 0, 1, hours, minutes);
}

// Lesson dates are real recent dates so the demo always looks up to date.
function daysAgo(days: number, hours: number, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function seedDemoData(context: DemoContext) {
  const {
    classEntity,
    mathematics,
    ukrainianLanguage,
    history,
    teachers,
    students,
    parentUser,
  } = context;

  const mathTeacher = teachers[0];
  const humanitiesTeacher = teachers[1];

  if (!mathTeacher || !humanitiesTeacher || students.length === 0) {
    console.warn('Skipping demo data: teachers or students are missing');
    return;
  }

  await clearActivityData();

  const classrooms = await seedClassrooms();

  const slotDefinitions: SlotDefinition[] = [
    // Monday
    {
      dayOfWeek: DayOfWeek.MONDAY,
      start: [9, 0],
      end: [10, 0],
      subject: mathematics,
      teacher: mathTeacher,
      classroom: classrooms[0],
    },
    {
      dayOfWeek: DayOfWeek.MONDAY,
      start: [10, 15],
      end: [11, 15],
      subject: ukrainianLanguage,
      teacher: humanitiesTeacher,
      classroom: classrooms[1],
    },
    // Tuesday
    {
      dayOfWeek: DayOfWeek.TUESDAY,
      start: [9, 0],
      end: [10, 0],
      subject: history,
      teacher: humanitiesTeacher,
      classroom: classrooms[0],
    },
    {
      dayOfWeek: DayOfWeek.TUESDAY,
      start: [10, 15],
      end: [11, 15],
      subject: mathematics,
      teacher: mathTeacher,
      classroom: classrooms[0],
    },
    // Wednesday
    {
      dayOfWeek: DayOfWeek.WEDNESDAY,
      start: [9, 0],
      end: [10, 0],
      subject: mathematics,
      teacher: mathTeacher,
      classroom: classrooms[1],
    },
    {
      dayOfWeek: DayOfWeek.WEDNESDAY,
      start: [10, 15],
      end: [11, 15],
      subject: history,
      teacher: humanitiesTeacher,
      classroom: classrooms[0],
    },
    // Thursday
    {
      dayOfWeek: DayOfWeek.THURSDAY,
      start: [9, 0],
      end: [10, 0],
      subject: ukrainianLanguage,
      teacher: humanitiesTeacher,
      classroom: classrooms[1],
    },
    {
      dayOfWeek: DayOfWeek.THURSDAY,
      start: [10, 15],
      end: [11, 15],
      subject: mathematics,
      teacher: mathTeacher,
      classroom: classrooms[0],
    },
    // Friday
    {
      dayOfWeek: DayOfWeek.FRIDAY,
      start: [9, 0],
      end: [10, 0],
      subject: mathematics,
      teacher: mathTeacher,
      classroom: classrooms[0],
    },
    {
      dayOfWeek: DayOfWeek.FRIDAY,
      start: [10, 15],
      end: [11, 15],
      subject: ukrainianLanguage,
      teacher: humanitiesTeacher,
      classroom: classrooms[1],
    },
  ];

  const slots = await seedScheduleSlots(classEntity, slotDefinitions);

  const lessonDefinitions: LessonDefinition[] = [
    {
      slotIndex: 0,
      daysAgo: 1,
      topic: 'Quadratic equations and the discriminant',
      homework: 'Exercises 4.12–4.18, page 87',
    },
    {
      slotIndex: 0,
      daysAgo: 8,
      topic: 'Completing the square',
      homework: 'Exercises 4.1–4.6, page 81',
    },
    {
      slotIndex: 1,
      daysAgo: 1,
      topic: 'Complex sentences with subordinate clauses',
      homework: 'Write a short essay (120–150 words)',
    },
    {
      slotIndex: 2,
      daysAgo: 2,
      topic: 'The formation of the Ukrainian nation',
      homework: 'Read chapter 12, answer questions 1–5',
    },
    {
      slotIndex: 3,
      daysAgo: 2,
      topic: 'Systems of linear equations',
      homework: 'Exercises 5.3–5.9, page 102',
    },
    {
      slotIndex: 4,
      daysAgo: 3,
      topic: 'Properties of quadratic functions',
      homework: 'Exercises 4.20–4.24, page 90',
    },
    {
      slotIndex: 5,
      daysAgo: 3,
      topic: 'Ukraine in the interwar period',
      homework: 'Prepare a short presentation',
    },
    {
      slotIndex: 6,
      daysAgo: 4,
      topic: 'Ukrainian lexicology and phraseology',
      homework: 'Learn the new vocabulary, exercise 6.4',
    },
    {
      slotIndex: 7,
      daysAgo: 4,
      topic: 'Inequalities with one variable',
      homework: 'Exercises 5.11–5.15, page 110',
    },
    {
      slotIndex: 8,
      daysAgo: 7,
      topic: 'Arithmetic and geometric progressions',
      homework: 'Exercises 6.1–6.8, page 128',
    },
  ];

  await seedLessonsGradesAndAttendance(
    classEntity,
    slots,
    lessonDefinitions,
    students,
    parentUser,
  );
}

async function clearActivityData() {
  await prisma.notification.deleteMany({});
  await prisma.gradeAuditLog.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.scheduleSlot.deleteMany({});
  await prisma.classroom.deleteMany({});
}

async function seedClassrooms() {
  const definitions = [
    { number: '101', building: 'Main', capacity: 30 },
    { number: '102', building: 'Main', capacity: 28 },
    { number: '205', building: 'Annex', capacity: 24 },
  ];

  const classrooms: Classroom[] = [];

  for (const definition of definitions) {
    classrooms.push(
      await prisma.classroom.upsert({
        where: {
          number_building: {
            number: definition.number,
            building: definition.building,
          },
        },
        update: {},
        create: definition,
      }),
    );
  }

  return classrooms;
}

async function seedScheduleSlots(
  classEntity: Class,
  definitions: SlotDefinition[],
) {
  const slots: Array<ScheduleSlot & { subject: Subject }> = [];

  for (const definition of definitions) {
    slots.push(
      await prisma.scheduleSlot.create({
        data: {
          classId: classEntity.id,
          subjectId: definition.subject.id,
          teacherId: definition.teacher.id,
          classroomId: definition.classroom.id,
          dayOfWeek: definition.dayOfWeek,
          startTime: slotTime(...definition.start),
          endTime: slotTime(...definition.end),
          weekType: WeekType.EVERY,
        },
        include: {
          subject: true,
        },
      }),
    );
  }

  return slots;
}

async function seedLessonsGradesAndAttendance(
  classEntity: Class,
  slots: Array<ScheduleSlot & { subject: Subject }>,
  definitions: LessonDefinition[],
  students: Student[],
  parentUser: User,
) {
  const parentChildIds = new Set(
    students.slice(0, 2).map((student) => student.id),
  );

  for (let lessonIndex = 0; lessonIndex < definitions.length; lessonIndex++) {
    const definition = definitions[lessonIndex];
    const slot = slots[definition.slotIndex];

    if (!slot || !definition) {
      continue;
    }

    const lesson = await prisma.lesson.create({
      data: {
        teacherId: slot.teacherId,
        classId: classEntity.id,
        subjectId: slot.subjectId,
        classroomId: slot.classroomId,
        scheduleSlotId: slot.id,
        date: daysAgo(
          definition.daysAgo,
          slot.startTime.getHours(),
          slot.startTime.getMinutes(),
        ),
        topic: definition.topic,
        homework: definition.homework,
      },
    });

    for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
      const student = students[studentIndex];

      if (!student) {
        continue;
      }

      // Deterministic spread of marks in the Ukrainian 12-point scale.
      const value = 8 + ((lessonIndex + studentIndex * 2) % 5);

      const grade = await prisma.grade.create({
        data: {
          lessonId: lesson.id,
          studentId: student.id,
          value,
          comment: value >= 11 ? 'Great work in class' : null,
        },
      });

      await prisma.gradeAuditLog.create({
        data: {
          gradeId: grade.id,
          lessonId: lesson.id,
          studentId: student.id,
          teacherId: slot.teacherId,
          action: GradeAuditAction.CREATED,
          oldValue: null,
          newValue: value,
          oldComment: null,
          newComment: grade.comment,
        },
      });

      const isPresent = !(studentIndex === 3 && lessonIndex % 3 === 0);

      await prisma.attendance.create({
        data: {
          lessonId: lesson.id,
          studentId: student.id,
          isPresent,
        },
      });

      if (isPresent) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            type: NotificationType.NEW_GRADE,
            title: 'New grade received',
            message: `You received a ${value} in ${slot.subject.name}: ${lesson.topic}.`,
            gradeId: grade.id,
            lessonId: lesson.id,
          },
        });

        if (parentChildIds.has(student.id)) {
          await prisma.notification.create({
            data: {
              userId: parentUser.id,
              type: NotificationType.NEW_GRADE,
              title: 'New grade for your child',
              message: `${student.firstName} ${student.lastName} received a ${value} in ${slot.subject.name}.`,
              gradeId: grade.id,
              lessonId: lesson.id,
            },
          });
        }
      }
    }
  }

  // A schedule-change notification so the notifications screen is not empty.
  const firstSlot = slots[0];
  if (firstSlot) {
    for (const student of students) {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          type: NotificationType.SCHEDULE_CHANGED,
          title: 'Schedule updated',
          message: `The timetable for ${firstSlot.subject.name} has been updated.`,
          scheduleSlotId: firstSlot.id,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
