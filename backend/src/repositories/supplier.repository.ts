import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class SupplierRepository {
  async findAll() {
    return prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({
      data
    });
  }

  async update(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.supplier.delete({
      where: { id }
    });
  }
}
