import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import type { Student } from '@prisma/client';
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
    update: {},
    create: {
      email: 'admin@test.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const classEntity = await upsertClass('10-A');

  await Promise.all([
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

    await prisma.teacher.upsert({
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

  console.log('Seed completed');
  console.log(`Default password for seeded users: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
