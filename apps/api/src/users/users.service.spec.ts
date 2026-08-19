import type { AuthenticatedUser } from '@/auth/types';
import type { PrismaService } from '@/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const superAdmin: AuthenticatedUser = {
  id: 1,
  email: 'root@test.com',
  role: Role.ADMIN,
  isSuperAdmin: true,
};

const plainAdmin: AuthenticatedUser = {
  id: 2,
  email: 'admin@test.com',
  role: Role.ADMIN,
  isSuperAdmin: false,
};

describe('UsersService admin protections', () => {
  let service: UsersService;
  let tx: {
    user: {
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
    teacher: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    student: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    parent: { findUnique: jest.Mock; create: jest.Mock };
    class: { findFirst: jest.Mock; create: jest.Mock };
  };
  let prisma: {
    $transaction: jest.Mock;
    user: {
      findUnique: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    tx = {
      user: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      teacher: {
        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
        create: jest.fn(),
        update: jest.fn(),
      },
      student: {
        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
        create: jest.fn(),
        update: jest.fn(),
      },
      parent: {
        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
        create: jest.fn(),
      },
      class: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn(async (fn: (client: unknown) => Promise<unknown>) =>
        fn(tx),
      ),
      user: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    const adminDto = {
      email: 'new-admin@test.com',
      password: 'secret123',
      role: Role.ADMIN,
    } as CreateUserDto;

    it('forbids a plain admin from creating administrators', async () => {
      await expect(service.create(plainAdmin, adminDto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows the super admin to create administrators', async () => {
      tx.user.create.mockResolvedValue({ id: 3, ...adminDto });

      await expect(service.create(superAdmin, adminDto)).resolves.toMatchObject(
        { email: adminDto.email },
      );
      expect(tx.user.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('forbids a plain admin from editing an admin account', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
        isSuperAdmin: true,
      });

      await expect(
        service.update(plainAdmin, 1, { email: 'x@test.com' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids a plain admin from promoting a user to ADMIN', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 5,
        role: Role.TEACHER,
        isSuperAdmin: false,
      });

      await expect(
        service.update(plainAdmin, 5, { role: Role.ADMIN }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids a plain admin from setting the super admin flag', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 5,
        role: Role.TEACHER,
        isSuperAdmin: false,
      });

      await expect(
        service.update(plainAdmin, 5, {
          isSuperAdmin: true,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows a plain admin to edit a non-admin user', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 5,
        role: Role.TEACHER,
        isSuperAdmin: false,
      });
      tx.user.update.mockResolvedValue({ id: 5, role: Role.TEACHER });

      await expect(
        service.update(plainAdmin, 5, { email: 'x@test.com' }),
      ).resolves.toMatchObject({ id: 5 });
    });

    it('forbids removing the super admin flag from the last super admin', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
        isSuperAdmin: true,
      });
      tx.user.count.mockResolvedValue(1);

      await expect(
        service.update(superAdmin, 1, {
          isSuperAdmin: false,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows demoting a super admin while another one exists', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: 9,
        role: Role.ADMIN,
        isSuperAdmin: true,
      });
      tx.user.count.mockResolvedValue(2);
      tx.user.update.mockResolvedValue({ id: 9, role: Role.TEACHER });

      await expect(
        service.update(superAdmin, 9, { role: Role.TEACHER }),
      ).resolves.toMatchObject({ id: 9 });
    });
  });

  describe('remove', () => {
    it('forbids deleting your own account', async () => {
      await expect(
        service.remove(superAdmin, superAdmin.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('forbids a plain admin from deleting another admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        role: Role.ADMIN,
        isSuperAdmin: false,
      });

      await expect(service.remove(plainAdmin, 1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows the super admin to delete another admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        role: Role.ADMIN,
        isSuperAdmin: false,
      });
      prisma.user.delete.mockResolvedValue({ id: 2 });

      await expect(service.remove(superAdmin, 2)).resolves.toMatchObject({
        id: 2,
      });
    });

    it('forbids deleting the last super admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 9,
        role: Role.ADMIN,
        isSuperAdmin: true,
      });
      prisma.user.count.mockResolvedValue(1);

      await expect(service.remove(superAdmin, 9)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
