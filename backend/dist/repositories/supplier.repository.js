"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierRepository = void 0;
const db_1 = require("../config/db");
class SupplierRepository {
    async findAll() {
        return db_1.prisma.supplier.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async findById(id) {
        return db_1.prisma.supplier.findUnique({
            where: { id },
            include: {
                purchaseOrders: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    async create(data) {
        return db_1.prisma.supplier.create({
            data
        });
    }
    async update(id, data) {
        return db_1.prisma.supplier.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return db_1.prisma.supplier.delete({
            where: { id }
        });
    }
}
exports.SupplierRepository = SupplierRepository;
