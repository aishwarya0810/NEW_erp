import { prisma } from '../config/db';

export class RefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  async findByToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
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
        }
      }
    });
  }

  async revoke(token: string) {
    return prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true }
    });
  }

  async revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
  }

  async deleteExpired() {
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    });
  }
}
