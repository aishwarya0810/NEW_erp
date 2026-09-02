import { SalesRepository } from '../repositories/sales.repository';
import { ProductRepository } from '../repositories/product.repository';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { AuditRepository } from '../repositories/audit.repository';

export class SalesService {
  constructor(
    private salesRepository: SalesRepository,
    private productRepository: ProductRepository,
    private warehouseRepository: WarehouseRepository,
    private auditRepository: AuditRepository
  ) {}

  // Customers
  async getCustomers() {
    return this.salesRepository.findAllCustomers();
  }

  async getCustomerById(id: string) {
    const customer = await this.salesRepository.findCustomerById(id);
    if (!customer) {
      throw new Error('Customer not found.');
    }
    return customer;
  }

  async createCustomer(data: any, userId?: string) {
    const customer = await this.salesRepository.createCustomer(data);
    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_CUSTOMER',
      newValue: customer
    });
    return customer;
  }

  async updateCustomer(id: string, data: any, userId?: string) {
    const customer = await this.salesRepository.findCustomerById(id);
    if (!customer) {
      throw new Error('Customer not found.');
    }
    const updated = await this.salesRepository.updateCustomer(id, data);
    await this.auditRepository.createLog({
      userId,
      action: 'UPDATE_CUSTOMER',
      oldValue: customer,
      newValue: updated
    });
    return updated;
  }

  // Sales Orders
  async getSalesOrders(options?: { status?: string; customerId?: string }) {
    return this.salesRepository.findAll(options);
  }

  async getSalesOrderById(id: string) {
    const so = await this.salesRepository.findById(id);
    if (!so) {
      throw new Error('Sales Order not found.');
    }
    return so;
  }

  async createSalesOrder(data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }, userId?: string) {
    // Verify customer exists
    const customer = await this.salesRepository.findCustomerById(data.customerId);
    if (!customer) {
      throw new Error('Customer not found.');
    }

    // Verify products exist
    for (const item of data.items) {
      const prod = await this.productRepository.findById(item.productId);
      if (!prod) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
    }

    // Generate SO number: SO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = (await this.salesRepository.findAll()).length + 1;
    const soNumber = `SO-${dateStr}-${String(count).padStart(4, '0')}`;

    const soData = {
      soNumber,
      customerId: data.customerId,
      status: 'PENDING',
      totalAmount: 0 // Calculated by transaction
    };

    const so = await this.salesRepository.create(soData, data.items);

    await this.auditRepository.createLog({
      userId,
      action: 'CREATE_SALES_ORDER',
      newValue: so
    });

    return so;
  }

  async shipSalesOrder(id: string, warehouseId: string, userId?: string) {
    const so = await this.salesRepository.findById(id);
    if (!so) {
      throw new Error('Sales Order not found.');
    }

    if (so.status === 'SHIPPED' || so.status === 'DELIVERED') {
      throw new Error('Sales Order is already shipped or delivered.');
    }
    if (so.status === 'CANCELLED') {
      throw new Error('Sales Order has been cancelled.');
    }

    // Verify warehouse exists
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new Error('Warehouse not found.');
    }

    // Verify stock availability in this specific warehouse
    const currentStockList = await this.warehouseRepository.findStockLevels(warehouseId);
    
    for (const item of so.items) {
      const stock = currentStockList.find(s => s.product.id === item.productId);
      const stockQty = stock ? stock.quantity : 0;
      if (stockQty < item.quantity) {
        throw new Error(`Insufficient stock in ${warehouse.name} for product: ${item.product.name}. Required: ${item.quantity}, Available: ${stockQty}`);
      }
    }

    // Deduct stock and update status
    const updatedSo = await this.salesRepository.updateStatus(id, 'SHIPPED');

    for (const item of so.items) {
      await this.productRepository.createStockMovement({
        productId: item.productId,
        warehouseId,
        type: 'OUTBOUND',
        quantity: item.quantity,
        reason: `Shipped for Sales Order: ${so.soNumber}`
      });
    }

    await this.auditRepository.createLog({
      userId,
      action: 'SHIP_SALES_ORDER',
      newValue: {
        salesOrderId: so.id,
        soNumber: so.soNumber,
        warehouseId
      }
    });

    return updatedSo;
  }

  async updateSalesOrderStatus(id: string, status: string, userId?: string) {
    const so = await this.salesRepository.findById(id);
    if (!so) {
      throw new Error('Sales Order not found.');
    }

    if (status === 'SHIPPED') {
      throw new Error('Please use /ship endpoint to ship and deduct stock.');
    }

    const updated = await this.salesRepository.updateStatus(id, status);

    await this.auditRepository.createLog({
      userId,
      action: 'UPDATE_SALES_ORDER_STATUS',
      oldValue: so,
      newValue: updated
    });

    return updated;
  }
}
