"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesRepository = void 0;
const db_1 = require("../config/db");
class SalesRepository {
    async findAll(options) {
        const where = {};
        if (options?.status)
            where.status = options.status;
        if (options?.customerId)
            where.customerId = options.customerId;
        return db_1.prisma.salesOrder.findMany({
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
    async findById(id) {
        return db_1.prisma.salesOrder.findUnique({
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
    async create(data, items) {
        return db_1.prisma.$transaction(async (tx) => {
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
    async updateStatus(id, status) {
        return db_1.prisma.salesOrder.update({
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
        return db_1.prisma.customer.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async findCustomerById(id) {
        return db_1.prisma.customer.findUnique({
            where: { id }
        });
    }
    async createCustomer(data) {
        return db_1.prisma.customer.create({
            data
        });
    }
    async updateCustomer(id, data) {
        return db_1.prisma.customer.update({
            where: { id },
            data
        });
    }
}
exports.SalesRepository = SalesRepository;
