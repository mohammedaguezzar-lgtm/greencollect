import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import type { AdminCreateUserInput } from '@/lib/validators/user';
import type { UpdateMeInput } from '@/lib/validators/user';
import type { Prisma, UserRole } from '@prisma/client';

export async function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      locale: true,
      organizationId: true,
      createdAt: true,
    },
  });
}

export async function updateMe(userId: string, data: UpdateMeInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      locale: true,
      organizationId: true,
    },
  });
}

export async function listUsers(params: {
  page: number;
  pageSize: number;
  role?: UserRole;
  search?: string;
}) {
  const where: Prisma.UserWhereInput = {};
  if (params.role) where.role = params.role;
  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { name: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        locale: true,
        createdAt: true,
      },
    }),
  ]);

  return { data, total };
}

export async function adminCreateUser(data: AdminCreateUserInput) {
  const hash = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      status: 'ACTIVE',
      passwordHash: hash,
      locale: 'fr',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });
}

export async function adminUpdateUser(
  id: string,
  data: { role?: UserRole; status?: import('@prisma/client').UserStatus; name?: string },
) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_EXISTS');

  const hash = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      passwordHash: hash,
      role: 'USER',
      status: 'ACTIVE',
      locale: 'fr',
    },
    select: { id: true, email: true, name: true },
  });
}
