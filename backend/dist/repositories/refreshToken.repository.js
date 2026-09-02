"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenRepository = void 0;
const db_1 = require("../config/db");
class RefreshTokenRepository {
    async create(userId, token, expiresAt) {
        return db_1.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt
            }
        });
    }
    async findByToken(token) {
        return db_1.prisma.refreshToken.findUnique({
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
    async revoke(token) {
        return db_1.prisma.refreshToken.update({
            where: { token },
            data: { isRevoked: true }
        });
    }
    async revokeAllForUser(userId) {
        return db_1.prisma.refreshToken.updateMany({
            where: { userId },
            data: { isRevoked: true }
        });
    }
    async deleteExpired() {
        return db_1.prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isRevoked: true }
                ]
            }
        });
    }
}
exports.RefreshTokenRepository = RefreshTokenRepository;
