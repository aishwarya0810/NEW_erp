import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export class DashboardController {
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Total Products Count
      const totalProducts = await prisma.product.count({
        where: { status: 'ACTIVE' }
      });

      // 2. Total Stock Value (cost * quantity)
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { cost: true, quantity: true }
      });
      const totalStockValue = products.reduce((sum, p) => sum + (Number(p.cost) * p.quantity), 0);

      // 3. Low Stock Count (quantity <= reorderLevel)
      const lowStockCount = await prisma.product.count({
        where: {
          status: 'ACTIVE',
          quantity: {
            lte: prisma.product.fields.reorderLevel
          }
        }
      });

      // 4. Pending Purchase Orders (DRAFT, PENDING_APPROVAL, APPROVED, SHIPPED)
      const pendingPurchases = await prisma.purchaseOrder.count({
        where: {
          status: {
            in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SHIPPED']
          }
        }
      });

      // 5. Recent Stock Movements
      const recentMovements = await prisma.stockMovement.findMany({
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
      const recentAuditLogs = await prisma.auditLog.findMany({
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
    } catch (error) {
      next(error);
    }
  };
}
