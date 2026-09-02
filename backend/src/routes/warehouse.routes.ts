import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { WarehouseService } from '../services/warehouse.service';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { protect } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

const warehouseRepository = new WarehouseRepository();
const auditRepository = new AuditRepository();
const warehouseService = new WarehouseService(warehouseRepository, auditRepository);
const warehouseController = new WarehouseController(warehouseService);

router.get('/', protect, warehouseController.getWarehouses);
router.get('/:id', protect, warehouseController.getWarehouseById);
router.get('/:id/stock', protect, warehouseController.getWarehouseStock);

router.post('/transfer', protect, requireRoles('ADMIN', 'MANAGER', 'WAREHOUSE_MANAGER'), warehouseController.transferStock);
router.post('/', protect, requireRoles('ADMIN'), warehouseController.createWarehouse);
router.put('/:id', protect, requireRoles('ADMIN'), warehouseController.updateWarehouse);
router.delete('/:id', protect, requireRoles('ADMIN'), warehouseController.deleteWarehouse);

export default router;
