import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class ProductRepository {
  async findAll(options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ProductWhereInput = {};

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { sku: { contains: options.search, mode: 'insensitive' } },
        { barcode: { contains: options.search, mode: 'insensitive' } }
      ];
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    return prisma.product.findMany({
      where,
      include: {
        category: true
      },
      skip: options?.skip || 0,
      take: options?.take || 50,
      orderBy: { name: 'asc' }
    });
  }

  async count(options?: {
    search?: string;
    categoryId?: string;
    status?: string;
  }) {
    const where: Prisma.ProductWhereInput = {};

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { sku: { contains: options.search, mode: 'insensitive' } },
        { barcode: { contains: options.search, mode: 'insensitive' } }
      ];
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    return prisma.product.count({ where });
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: {
          include: {
            warehouse: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku }
    });
  }

  async create(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({
      data,
      include: {
        category: true
      }
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: { id }
    });
  }

  // Categories
  async findAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  async createCategory(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({
      data
    });
  }

  // Stock Movements
  async createStockMovement(data: Prisma.StockMovementUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Create stock movement record
      const movement = await tx.stockMovement.create({
        data,
        include: {
          product: true,
          warehouse: true
        }
      });

      // 2. Adjust product global quantity
      let quantityChange = data.quantity;
      if (data.type === 'OUTBOUND') {
        quantityChange = -data.quantity;
      } else if (data.type === 'TRANSFER_OUT' || data.type === 'TRANSFER_IN') {
        quantityChange = 0;
      }

      await tx.product.update({
        where: { id: data.productId },
        data: {
          quantity: {
            increment: quantityChange
          }
        }
      });

      return movement;
    });
  }

  async findStockMovements(options?: {
    productId?: string;
    warehouseId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.StockMovementWhereInput = {};
    if (options?.productId) where.productId = options.productId;
    if (options?.warehouseId) where.warehouseId = options.warehouseId;

    return prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true
      },
      skip: options?.skip || 0,
      take: options?.take || 50,
      orderBy: { createdAt: 'desc' }
    });
  }
}
