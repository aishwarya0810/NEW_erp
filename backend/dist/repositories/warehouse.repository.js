"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseRepository = void 0;
const db_1 = require("../config/db");
class WarehouseRepository {
    async findAll() {
        return db_1.prisma.warehouse.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async findById(id) {
        return db_1.prisma.warehouse.findUnique({
            where: { id },
            include: {
                stockMovements: {
                    include: {
                        product: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    async create(data) {
        return db_1.prisma.warehouse.create({
            data
        });
    }
    async update(id, data) {
        return db_1.prisma.warehouse.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return db_1.prisma.warehouse.delete({
            where: { id }
        });
    }
    async findStockLevels(warehouseId) {
        // Group stock movements to find current quantities in this warehouse
        const movements = await db_1.prisma.stockMovement.findMany({
            where: { warehouseId },
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        });
        const stockMap = new Map();
        for (const m of movements) {
            const prodId = m.productId;
            const current = stockMap.get(prodId) || { product: m.product, quantity: 0 };
            if (m.type === 'OUTBOUND' || m.type === 'TRANSFER_OUT') {
                current.quantity -= m.quantity;
            }
            else {
                current.quantity += m.quantity;
            }
            stockMap.set(prodId, current);
        }
        return Array.from(stockMap.values());
    }
}
exports.WarehouseRepository = WarehouseRepository;
