import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller';
import { PurchaseService } from '../services/purchase.service';
import { PurchaseRepository } from '../repositories/purchase.repository';
import { ProductRepository } from '../repositories/product.repository';
import { SupplierRepository } from '../repositories/supplier.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { protect } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

const purchaseRepository = new PurchaseRepository();
const productRepository = new ProductRepository();
const supplierRepository = new SupplierRepository();
const auditRepository = new AuditRepository();

const purchaseService = new PurchaseService(
  purchaseRepository,
  productRepository,
  supplierRepository,
  auditRepository
);
const purchaseController = new PurchaseController(purchaseService);

// Suppliers
router.get('/suppliers', protect, purchaseController.getSuppliers);
router.get('/suppliers/:id', protect, purchaseController.getSupplierById);
router.post('/suppliers', protect, requireRoles('ADMIN', 'MANAGER'), purchaseController.createSupplier);
router.put('/suppliers/:id', protect, requireRoles('ADMIN', 'MANAGER'), purchaseController.updateSupplier);
router.delete('/suppliers/:id', protect, requireRoles('ADMIN'), purchaseController.deleteSupplier);

// Purchase Orders
router.get('/orders', protect, purchaseController.getPurchaseOrders);
router.get('/orders/:id', protect, purchaseController.getPurchaseOrderById);
router.post('/orders', protect, requireRoles('ADMIN', 'MANAGER'), purchaseController.createPurchaseOrder);
router.patch('/orders/:id/status', protect, requireRoles('ADMIN', 'MANAGER'), purchaseController.updateStatus);
router.post('/orders/:id/receive', protect, requireRoles('ADMIN', 'MANAGER', 'WAREHOUSE_MANAGER'), purchaseController.receiveOrder);

export default router;
