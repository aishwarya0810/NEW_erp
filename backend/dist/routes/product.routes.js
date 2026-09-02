"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const product_service_1 = require("../services/product.service");
const product_repository_1 = require("../repositories/product.repository");
const audit_repository_1 = require("../repositories/audit.repository");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
const productRepository = new product_repository_1.ProductRepository();
const auditRepository = new audit_repository_1.AuditRepository();
const productService = new product_service_1.ProductService(productRepository, auditRepository);
const productController = new product_controller_1.ProductController(productService);
// Public/Authenticated reading routes
router.get('/', auth_middleware_1.protect, productController.getProducts);
router.get('/categories', auth_middleware_1.protect, productController.getCategories);
router.get('/movements', auth_middleware_1.protect, productController.getStockMovements);
router.get('/:id', auth_middleware_1.protect, productController.getProductById);
// Write/Edit routes
router.post('/', auth_middleware_1.protect, (0, role_middleware_1.requireRoles)('ADMIN', 'INVENTORY_STAFF'), productController.createProduct);
router.put('/:id', auth_middleware_1.protect, (0, role_middleware_1.requireRoles)('ADMIN', 'INVENTORY_STAFF'), productController.updateProduct);
router.delete('/:id', auth_middleware_1.protect, (0, role_middleware_1.requireRoles)('ADMIN'), productController.deleteProduct);
router.post('/categories', auth_middleware_1.protect, (0, role_middleware_1.requireRoles)('ADMIN', 'INVENTORY_STAFF'), productController.createCategory);
router.post('/adjust', auth_middleware_1.protect, (0, role_middleware_1.requireRoles)('ADMIN', 'INVENTORY_STAFF', 'WAREHOUSE_MANAGER'), productController.adjustStock);
exports.default = router;
