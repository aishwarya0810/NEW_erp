"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const db_1 = require("../config/db");
class ProductRepository {
    async findAll(options) {
        const where = {};
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
        return db_1.prisma.product.findMany({
            where,
            include: {
                category: true
            },
            skip: options?.skip || 0,
            take: options?.take || 50,
            orderBy: { name: 'asc' }
        });
    }
    async count(options) {
        const where = {};
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
        return db_1.prisma.product.count({ where });
    }
    async findById(id) {
        return db_1.prisma.product.findUnique({
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
    async findBySku(sku) {
        return db_1.prisma.product.findUnique({
            where: { sku }
        });
    }
    async create(data) {
        return db_1.prisma.product.create({
            data,
            include: {
                category: true
            }
        });
    }
    async update(id, data) {
        return db_1.prisma.product.update({
            where: { id },
            data,
            include: {
                category: true
            }
        });
    }
    async delete(id) {
        return db_1.prisma.product.delete({
            where: { id }
        });
    }
    // Categories
    async findAllCategories() {
        return db_1.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async findCategoryById(id) {
        return db_1.prisma.category.findUnique({
            where: { id }
        });
    }
    async createCategory(data) {
        return db_1.prisma.category.create({
            data
        });
    }
    // Stock Movements
    async createStockMovement(data) {
        return db_1.prisma.$transaction(async (tx) => {
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
            }
            else if (data.type === 'TRANSFER_OUT' || data.type === 'TRANSFER_IN') {
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
    async findStockMovements(options) {
        const where = {};
        if (options?.productId)
            where.productId = options.productId;
        if (options?.warehouseId)
            where.warehouseId = options.warehouseId;
        return db_1.prisma.stockMovement.findMany({
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
exports.ProductRepository = ProductRepository;
