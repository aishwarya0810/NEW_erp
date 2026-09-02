import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class PurchaseRepository {
  async findAll(options?: { status?: string; supplierId?: string }) {
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (options?.status) where.status = options.status;
    if (options?.supplierId) where.supplierId = options.supplierId;

    return prisma.purchaseOrder.findMany({
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

  async findById(id: string) {
    return prisma.purchaseOrder.findUnique({
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

  async create(data: Prisma.PurchaseOrderUncheckedCreateInput, items: Array<{ productId: string; quantity: number; unitCost: number }>) {
    return prisma.$transaction(async (tx) => {
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

  async updateStatus(id: string, status: string) {
    return prisma.purchaseOrder.update({
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

  async delete(id: string) {
    return prisma.purchaseOrder.delete({
      where: { id }
    });
  }
}
