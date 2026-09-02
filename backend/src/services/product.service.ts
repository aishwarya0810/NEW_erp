import { ProductRepository } from '../repositories/product.repository';
import { AuditRepository } from '../repositories/audit.repository';

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private auditRepository: AuditRepository
  ) {}

  async getProducts(options?: {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const limit = options?.limit || 50;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productRepository.findAll({
        search: options?.search,
        categoryId: options?.categoryId,
        status: options?.status,
        skip,
        take: limit
      }),
      this.productRepository.count({
        search: options?.search,
        categoryId: options?.categoryId,
        status: options?.status
      })
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found.');
    }
    return product;
  }

  async createProduct(data: any, userId?: string) {
    const existing = await this.productRepository.findBySku(data.sku);
    if (existing) {
      throw new Error(`SKU '${data.sku}' already exists.`);
    }

    const product = await this.productRepository.create(data);

    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_PRODUCT',
      newValue: product
    });

    return product;
  }

  async updateProduct(id: string, data: any, userId?: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found.');
    }

    if (data.sku && data.sku !== product.sku) {
      const existing = await this.productRepository.findBySku(data.sku);
      if (existing) {
        throw new Error(`SKU '${data.sku}' already exists.`);
      }
    }

    const updated = await this.productRepository.update(id, data);

    await this.auditRepository.createLog({
      userId,
      action: 'UPDATE_PRODUCT',
      oldValue: product,
      newValue: updated
    });

    return updated;
  }

  async deleteProduct(id: string, userId?: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found.');
    }

    await this.productRepository.delete(id);

    await this.auditRepository.createLog({
      userId,
      action: 'DELETE_PRODUCT',
      oldValue: product
    });
  }

  // Categories
  async getCategories() {
    return this.productRepository.findAllCategories();
  }

  async createCategory(data: { name: string; description?: string }, userId?: string) {
    const category = await this.productRepository.createCategory(data);
    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_CATEGORY',
      newValue: category
    });
    return category;
  }

  // Stock Adjustments
  async recordStockAdjustment(data: {
    productId: string;
    warehouseId: string;
    type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';
    quantity: number;
    reason?: string;
  }, userId?: string) {
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    if (data.type === 'OUTBOUND' && product.quantity < data.quantity) {
      throw new Error(`Insufficient stock. Current global stock is ${product.quantity}.`);
    }

    const movement = await this.productRepository.createStockMovement({
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason
    });

    await this.auditRepository.createLog({
      userId,
      action: 'STOCK_ADJUSTMENT',
      newValue: movement
    });

    return movement;
  }

  async getStockMovements(options?: { productId?: string; warehouseId?: string }) {
    return this.productRepository.findStockMovements(options);
  }
}
