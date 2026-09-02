import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  constructor(private productService: ProductService) {}

  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const status = req.query.status as string;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

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
    } catch (error: any) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const product = await this.productService.getProductById(id);
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Product not found.'
      });
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const product = await this.productService.createProduct(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        data: product
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Product creation failed.'
      });
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const product = await this.productService.updateProduct(id, req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: product
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Product update failed.'
      });
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      await this.productService.deleteProduct(id, userId);
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully.'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Product deletion failed.'
      });
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.productService.getCategories();
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const category = await this.productService.createCategory(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: category
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Category creation failed.'
      });
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const movement = await this.productService.recordStockAdjustment(req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully.',
        data: movement
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Stock adjustment failed.'
      });
    }
  };

  getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.query.productId as string;
      const warehouseId = req.query.warehouseId as string;
      const movements = await this.productService.getStockMovements({ productId, warehouseId });
      res.status(200).json({
        success: true,
        data: movements
      });
    } catch (error: any) {
      next(error);
    }
  };
}
