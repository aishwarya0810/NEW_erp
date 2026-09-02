"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../config/db");
class UserRepository {
    async findByEmail(email) {
        return db_1.prisma.user.findUnique({
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
    async findById(id) {
        return db_1.prisma.user.findUnique({
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
    async create(data) {
        return db_1.prisma.user.create({
            data,
            include: {
                role: true
            }
        });
    }
    async update(id, data) {
        return db_1.prisma.user.update({
            where: { id },
            data,
            include: {
                role: true
            }
        });
    }
    async delete(id) {
        return db_1.prisma.user.delete({
            where: { id }
        });
    }
    async findAll() {
        return db_1.prisma.user.findMany({
            include: {
                role: {
                    select: { id: true, name: true, description: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findAllRoles() {
        return db_1.prisma.role.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async findRoleByName(name) {
        return db_1.prisma.role.findUnique({
            where: { name }
        });
    }
    async findRoleById(id) {
        return db_1.prisma.role.findUnique({
            where: { id }
        });
    }
}
exports.UserRepository = UserRepository;
