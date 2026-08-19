import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config({ path: '.env' });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const adminEmail = 'admin@test.com';
const defaultPassword = 'admin123';

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      password: passwordHash,
      role: Role.ADMIN,
      isSuperAdmin: true,
    },
    create: {
      email: adminEmail,
      password: passwordHash,
      role: Role.ADMIN,
      isSuperAdmin: true,
    },
  });

  console.log('Super admin seed completed');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
