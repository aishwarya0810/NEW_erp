import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';
import { ProductRepository } from '../repositories/product.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { protect } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

const productRepository = new ProductRepository();
const auditRepository = new AuditRepository();
const productService = new ProductService(productRepository, auditRepository);
const productController = new ProductController(productService);

// Public/Authenticated reading routes
router.get('/', protect, productController.getProducts);
router.get('/categories', protect, productController.getCategories);
router.get('/movements', protect, productController.getStockMovements);
router.get('/:id', protect, productController.getProductById);

// Write/Edit routes
router.post('/', protect, requireRoles('ADMIN', 'INVENTORY_STAFF'), productController.createProduct);
router.put('/:id', protect, requireRoles('ADMIN', 'INVENTORY_STAFF'), productController.updateProduct);
router.delete('/:id', protect, requireRoles('ADMIN'), productController.deleteProduct);

router.post('/categories', protect, requireRoles('ADMIN', 'INVENTORY_STAFF'), productController.createCategory);
router.post('/adjust', protect, requireRoles('ADMIN', 'INVENTORY_STAFF', 'WAREHOUSE_MANAGER'), productController.adjustStock);

export default router;
