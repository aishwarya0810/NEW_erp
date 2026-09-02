"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
class ProductController {
    productService;
    constructor(productService) {
        this.productService = productService;
    }
    getProducts = async (req, res, next) => {
        try {
            const search = req.query.search;
            const categoryId = req.query.categoryId;
            const status = req.query.status;
            const page = req.query.page ? parseInt(req.query.page) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            const result = await this.productService.getProducts({
                search,
                categoryId,
                status,
                page,
                limit
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    };
    getProductById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const product = await this.productService.getProductById(id);
            res.status(200).json({
                success: true,
                data: product
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message || 'Product not found.'
            });
        }
    };
    createProduct = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const product = await this.productService.createProduct(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Product created successfully.',
                data: product
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Product creation failed.'
            });
        }
    };
    updateProduct = async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            const product = await this.productService.updateProduct(id, req.body, userId);
            res.status(200).json({
                success: true,
                message: 'Product updated successfully.',
                data: product
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Product update failed.'
            });
        }
    };
    deleteProduct = async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            await this.productService.deleteProduct(id, userId);
            res.status(200).json({
                success: true,
                message: 'Product deleted successfully.'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Product deletion failed.'
            });
        }
    };
    getCategories = async (req, res, next) => {
        try {
            const categories = await this.productService.getCategories();
            res.status(200).json({
                success: true,
                data: categories
            });
        }
        catch (error) {
            next(error);
        }
    };
    createCategory = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const category = await this.productService.createCategory(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Category created successfully.',
                data: category
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Category creation failed.'
            });
        }
    };
    adjustStock = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const movement = await this.productService.recordStockAdjustment(req.body, userId);
            res.status(200).json({
                success: true,
                message: 'Stock adjusted successfully.',
                data: movement
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Stock adjustment failed.'
            });
        }
    };
    getStockMovements = async (req, res, next) => {
        try {
            const productId = req.query.productId;
            const warehouseId = req.query.warehouseId;
            const movements = await this.productService.getStockMovements({ productId, warehouseId });
            res.status(200).json({
                success: true,
                data: movements
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ProductController = ProductController;
