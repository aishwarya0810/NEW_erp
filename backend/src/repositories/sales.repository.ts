import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class SalesRepository {
  async findAll(options?: { status?: string; customerId?: string }) {
    const where: Prisma.SalesOrderWhereInput = {};
    if (options?.status) where.status = options.status;
    if (options?.customerId) where.customerId = options.customerId;

    return prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
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
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async create(data: Prisma.SalesOrderUncheckedCreateInput, items: Array<{ productId: string; quantity: number; unitPrice: number }>) {
    return prisma.$transaction(async (tx) => {
      // 1. Calculate totals
      let totalAmount = 0;
      const orderItemsData = items.map((item) => {
        const cost = item.quantity * item.unitPrice;
        totalAmount += cost;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: cost
        };
      });

      // 2. Create the Sales Order
      const salesOrder = await tx.salesOrder.create({
        data: {
          ...data,
          totalAmount,
          items: {
            create: orderItemsData
          }
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return salesOrder;
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  // Customers
  async findAllCustomers() {
    return prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findCustomerById(id: string) {
    return prisma.customer.findUnique({
      where: { id }
    });
  }

  async createCustomer(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({
      data
    });
  }

  async updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data
    });
  }
}
