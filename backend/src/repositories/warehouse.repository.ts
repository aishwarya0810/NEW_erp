import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class WarehouseRepository {
  async findAll() {
    return prisma.warehouse.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.warehouse.findUnique({
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

  async create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({
      data
    });
  }

  async update(id: string, data: Prisma.WarehouseUpdateInput) {
    return prisma.warehouse.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.warehouse.delete({
      where: { id }
    });
  }

  async findStockLevels(warehouseId: string) {
    // Group stock movements to find current quantities in this warehouse
    const movements = await prisma.stockMovement.findMany({
      where: { warehouseId },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const stockMap = new Map<string, { product: any; quantity: number }>();

    for (const m of movements) {
      const prodId = m.productId;
      const current = stockMap.get(prodId) || { product: m.product, quantity: 0 };
      
      if (m.type === 'OUTBOUND' || m.type === 'TRANSFER_OUT') {
        current.quantity -= m.quantity;
      } else {
        current.quantity += m.quantity;
      }
      
      stockMap.set(prodId, current);
    }

    return Array.from(stockMap.values());
  }
}
