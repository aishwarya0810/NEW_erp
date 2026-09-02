import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class AuditRepository {
  async createLog(data: {
    userId?: string;
    action: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data
    });
  }

  async getLogs(limit = 100, offset = 0) {
    return prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
}
