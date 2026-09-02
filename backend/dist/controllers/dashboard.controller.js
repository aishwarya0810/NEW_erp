"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const db_1 = require("../config/db");
class DashboardController {
    getSummary = async (req, res, next) => {
        try {
            // 1. Total Products Count
            const totalProducts = await db_1.prisma.product.count({
                where: { status: 'ACTIVE' }
            });
            // 2. Total Stock Value (cost * quantity)
            const products = await db_1.prisma.product.findMany({
                where: { status: 'ACTIVE' },
                select: { cost: true, quantity: true }
            });
            const totalStockValue = products.reduce((sum, p) => sum + (Number(p.cost) * p.quantity), 0);
            // 3. Low Stock Count (quantity <= reorderLevel)
            const lowStockCount = await db_1.prisma.product.count({
                where: {
                    status: 'ACTIVE',
                    quantity: {
                        lte: db_1.prisma.product.fields.reorderLevel
                    }
                }
            });
            // 4. Pending Purchase Orders (DRAFT, PENDING_APPROVAL, APPROVED, SHIPPED)
            const pendingPurchases = await db_1.prisma.purchaseOrder.count({
                where: {
                    status: {
                        in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SHIPPED']
                    }
                }
            });
            // 5. Recent Stock Movements
            const recentMovements = await db_1.prisma.stockMovement.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: {
                        select: { name: true, sku: true }
                    },
                    warehouse: {
                        select: { name: true }
                    }
                }
            });
            // 6. Recent Audit Logs
            const recentAuditLogs = await db_1.prisma.auditLog.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' },
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            });
            res.status(200).json({
                success: true,
                data: {
                    totalProducts,
                    totalStockValue,
                    lowStockCount,
                    pendingPurchases,
                    recentMovements,
                    recentAuditLogs
                }
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DashboardController = DashboardController;
