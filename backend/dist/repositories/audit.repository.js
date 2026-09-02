"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const db_1 = require("../config/db");
class AuditRepository {
    async createLog(data) {
        return db_1.prisma.auditLog.create({
            data
        });
    }
    async getLogs(limit = 100, offset = 0) {
        return db_1.prisma.auditLog.findMany({
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
exports.AuditRepository = AuditRepository;
