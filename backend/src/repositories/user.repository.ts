import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  }

  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({
      data,
      include: {
        role: true
      }
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        role: true
      }
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id }
    });
  }

  async findAll() {
    return prisma.user.findMany({
      include: {
        role: {
          select: { id: true, name: true, description: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllRoles() {
    return prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findRoleByName(name: string) {
    return prisma.role.findUnique({
      where: { name }
    });
  }

  async findRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id }
    });
  }
}
