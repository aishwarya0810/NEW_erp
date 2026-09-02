import { PurchaseRepository } from '../repositories/purchase.repository';
import { ProductRepository } from '../repositories/product.repository';
import { SupplierRepository } from '../repositories/supplier.repository';
import { AuditRepository } from '../repositories/audit.repository';

export class PurchaseService {
  constructor(
    private purchaseRepository: PurchaseRepository,
    private productRepository: ProductRepository,
    private supplierRepository: SupplierRepository,
    private auditRepository: AuditRepository
  ) {}

  // Suppliers
  async getSuppliers() {
    return this.supplierRepository.findAll();
  }

  async getSupplierById(id: string) {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Supplier not found.');
    }
    return supplier;
  }

  async createSupplier(data: any, userId?: string) {
    const supplier = await this.supplierRepository.create(data);
    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_SUPPLIER',
      newValue: supplier
    });
    return supplier;
  }

  async updateSupplier(id: string, data: any, userId?: string) {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Supplier not found.');
    }
    const updated = await this.supplierRepository.update(id, data);
    await this.auditRepository.createLog({
      userId,
      action: 'UPDATE_SUPPLIER',
      oldValue: supplier,
      newValue: updated
    });
    return updated;
  }

  async deleteSupplier(id: string, userId?: string) {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier) {
      throw new Error('Supplier not found.');
    }
    await this.supplierRepository.delete(id);
    await this.auditRepository.createLog({
      userId,
      action: 'DELETE_SUPPLIER',
      oldValue: supplier
    });
  }

  // Purchase Orders
  async getPurchaseOrders(options?: { status?: string; supplierId?: string }) {
    return this.purchaseRepository.findAll(options);
  }

  async getPurchaseOrderById(id: string) {
    const po = await this.purchaseRepository.findById(id);
    if (!po) {
      throw new Error('Purchase Order not found.');
    }
    return po;
  }

  async createPurchaseOrder(data: {
    supplierId: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitCost: number }>;
  }, userId?: string) {
    // Check if supplier exists
    const supplier = await this.supplierRepository.findById(data.supplierId);
    if (!supplier) {
      throw new Error('Supplier not found.');
    }

    // Generate PO number: PO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = (await this.purchaseRepository.findAll()).length + 1;
    const poNumber = `PO-${dateStr}-${String(count).padStart(4, '0')}`;

    const poData = {
      poNumber,
      supplierId: data.supplierId,
      status: 'DRAFT',
      notes: data.notes,
      totalAmount: 0 // Will be calculated by repository transaction
    };

    const po = await this.purchaseRepository.create(poData, data.items);

    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_PURCHASE_ORDER',
      newValue: po
    });

    return po;
  }

  async updatePurchaseOrderStatus(id: string, status: string, userId?: string) {
    const po = await this.purchaseRepository.findById(id);
    if (!po) {
      throw new Error('Purchase Order not found.');
    }

    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new Error(`Cannot update status of a ${po.status} Purchase Order.`);
    }

    const updated = await this.purchaseRepository.updateStatus(id, status);

    await this.auditRepository.createLog({
      userId,
      action: 'UPDATE_PURCHASE_ORDER_STATUS',
      oldValue: po,
      newValue: updated
    });

    return updated;
  }

  async receivePurchaseOrder(id: string, warehouseId: string, userId?: string) {
    const po = await this.purchaseRepository.findById(id);
    if (!po) {
      throw new Error('Purchase Order not found.');
    }

    if (po.status === 'RECEIVED') {
      throw new Error('Purchase Order has already been received.');
    }
    if (po.status === 'CANCELLED') {
      throw new Error('Purchase Order has been cancelled.');
    }

    // Process receiving item stock
    const updatedPo = await this.purchaseRepository.updateStatus(id, 'RECEIVED');

    // Create stock movements for each item
    for (const item of po.items) {
      await this.productRepository.createStockMovement({
        productId: item.productId,
        warehouseId,
        type: 'INBOUND',
        quantity: item.quantity,
        reason: `Received from Purchase Order: ${po.poNumber}`
      });
    }

    await this.auditRepository.createLog({
      userId,
      action: 'RECEIVE_PURCHASE_ORDER',
      newValue: {
        purchaseOrderId: po.id,
        poNumber: po.poNumber,
        warehouseId
      }
    });

    return updatedPo;
  }
}
