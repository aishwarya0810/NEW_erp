"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRepository = void 0;
const db_1 = require("../config/db");
class PurchaseRepository {
    async findAll(options) {
        const where = {};
        if (options?.status)
            where.status = options.status;
        if (options?.supplierId)
            where.supplierId = options.supplierId;
        return db_1.prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findById(id) {
        return db_1.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
    }
    async create(data, items) {
        return db_1.prisma.$transaction(async (tx) => {
            // 1. Calculate totals
            let totalAmount = 0;
            const orderItemsData = items.map((item) => {
                const cost = item.quantity * item.unitCost;
                totalAmount += cost;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                    totalCost: cost
                };
            });
            // 2. Create the Purchase Order
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    ...data,
                    totalAmount,
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            return purchaseOrder;
        });
    }
    async updateStatus(id, status) {
        return db_1.prisma.purchaseOrder.update({
            where: { id },
            data: { status },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
    }
    async delete(id) {
        return db_1.prisma.purchaseOrder.delete({
            where: { id }
        });
    }
}
exports.PurchaseRepository = PurchaseRepository;
