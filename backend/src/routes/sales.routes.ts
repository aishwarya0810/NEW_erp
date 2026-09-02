import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { SalesService } from '../services/sales.service';
import { SalesRepository } from '../repositories/sales.repository';
import { ProductRepository } from '../repositories/product.repository';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { protect } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

const salesRepository = new SalesRepository();
const productRepository = new ProductRepository();
const warehouseRepository = new WarehouseRepository();
const auditRepository = new AuditRepository();

const salesService = new SalesService(
  salesRepository,
  productRepository,
  warehouseRepository,
  auditRepository
);
const salesController = new SalesController(salesService);

// Customers
router.get('/customers', protect, salesController.getCustomers);
router.get('/customers/:id', protect, salesController.getCustomerById);
router.post('/customers', protect, requireRoles('ADMIN', 'SALES_STAFF'), salesController.createCustomer);
router.put('/customers/:id', protect, requireRoles('ADMIN', 'SALES_STAFF'), salesController.updateCustomer);

// Sales Orders
router.get('/orders', protect, salesController.getSalesOrders);
router.get('/orders/:id', protect, salesController.getSalesOrderById);
router.post('/orders', protect, requireRoles('ADMIN', 'SALES_STAFF'), salesController.createSalesOrder);
router.patch('/orders/:id/status', protect, requireRoles('ADMIN', 'SALES_STAFF', 'MANAGER'), salesController.updateStatus);
router.post('/orders/:id/ship', protect, requireRoles('ADMIN', 'SALES_STAFF', 'WAREHOUSE_MANAGER'), salesController.shipOrder);

export default router;
