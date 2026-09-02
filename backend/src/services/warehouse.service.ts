import { WarehouseRepository } from '../repositories/warehouse.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { prisma } from '../config/db';

export class WarehouseService {
  constructor(
    private warehouseRepository: WarehouseRepository,
    private auditRepository: AuditRepository
  ) {}

  async getWarehouses() {
    return this.warehouseRepository.findAll();
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found.');
    }
    return warehouse;
  }

  async createWarehouse(data: any, userId?: string) {
    const warehouse = await this.warehouseRepository.create(data);

    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_WAREHOUSE',
      newValue: warehouse
    });

    return warehouse;
  }

  async updateWarehouse(id: string, data: any, userId?: string) {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found.');
    }

    const updated = await this.warehouseRepository.update(id, data);

    await this.auditRepository.createLog({
      userId,
      action: 'UPDATE_WAREHOUSE',
      oldValue: warehouse,
      newValue: updated
    });

    return updated;
  }

  async deleteWarehouse(id: string, userId?: string) {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new Error('Warehouse not found.');
    }

    await this.warehouseRepository.delete(id);

    await this.auditRepository.createLog({
      userId,
      action: 'DELETE_WAREHOUSE',
      oldValue: warehouse
    });
  }

  async getWarehouseStock(warehouseId: string) {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new Error('Warehouse not found.');
    }
    return this.warehouseRepository.findStockLevels(warehouseId);
  }

  async transferStock(
    payload: {
      productId: string;
      sourceWarehouseId: string;
      targetWarehouseId: string;
      quantity: number;
    },
    userId?: string
  ) {
    const { productId, sourceWarehouseId, targetWarehouseId, quantity } = payload;

    if (sourceWarehouseId === targetWarehouseId) {
      throw new Error('Source and target warehouses cannot be the same.');
    }

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than zero.');
    }

    // Verify source warehouse exists
    const sourceWarehouse = await this.warehouseRepository.findById(sourceWarehouseId);
    if (!sourceWarehouse) {
      throw new Error('Source warehouse not found.');
    }

    // Verify target warehouse exists
    const targetWarehouse = await this.warehouseRepository.findById(targetWarehouseId);
    if (!targetWarehouse) {
      throw new Error('Target warehouse not found.');
    }

    // Check source warehouse stock level
    const stockLevels = await this.warehouseRepository.findStockLevels(sourceWarehouseId);
    const productStock = stockLevels.find(s => s.product.id === productId);
    const availableQty = productStock ? productStock.quantity : 0;

    if (availableQty < quantity) {
      throw new Error(`Insufficient stock in source warehouse. Available: ${availableQty}, Requested: ${quantity}.`);
    }

    // Execute transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create TRANSFER_OUT movement for source warehouse
      const outMovement = await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: sourceWarehouseId,
          type: 'TRANSFER_OUT',
          quantity,
          reason: `Stock transfer to ${targetWarehouse.name}`
        }
      });

      // 2. Create TRANSFER_IN movement for target warehouse
      const inMovement = await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: targetWarehouseId,
          type: 'TRANSFER_IN',
          quantity,
          reason: `Stock transfer from ${sourceWarehouse.name}`
        }
      });

      return { outMovement, inMovement };
    });

    // Create Audit Log
    await this.auditRepository.createLog({
      userId,
      action: 'TRANSFER_STOCK',
      newValue: {
        productId,
        sourceWarehouseId,
        targetWarehouseId,
        quantity
      }
    });

    return result;
  }
}
