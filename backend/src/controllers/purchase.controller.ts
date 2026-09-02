import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from '../services/purchase.service';

export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  // Suppliers
  getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const suppliers = await this.purchaseService.getSuppliers();
      res.status(200).json({
        success: true,
        data: suppliers
      });
    } catch (error: any) {
      next(error);
    }
  };

  getSupplierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const supplier = await this.purchaseService.getSupplierById(id);
      res.status(200).json({
        success: true,
        data: supplier
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Supplier not found.'
      });
    }
  };

  createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const supplier = await this.purchaseService.createSupplier(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Supplier created successfully.',
        data: supplier
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Supplier creation failed.'
      });
    }
  };

  updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const supplier = await this.purchaseService.updateSupplier(id, req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully.',
        data: supplier
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Supplier update failed.'
      });
    }
  };

  deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      await this.purchaseService.deleteSupplier(id, userId);
      res.status(200).json({
        success: true,
        message: 'Supplier deleted successfully.'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Supplier deletion failed.'
      });
    }
  };

  // Purchase Orders
  getPurchaseOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string;
      const supplierId = req.query.supplierId as string;
      const orders = await this.purchaseService.getPurchaseOrders({ status, supplierId });
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      next(error);
    }
  };

  getPurchaseOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const order = await this.purchaseService.getPurchaseOrderById(id);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Purchase Order not found.'
      });
    }
  };

  createPurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const order = await this.purchaseService.createPurchaseOrder(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Purchase Order created successfully.',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Purchase Order creation failed.'
      });
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = req.user?.userId;
      const order = await this.purchaseService.updatePurchaseOrderStatus(id, status, userId);
      res.status(200).json({
        success: true,
        message: `Purchase Order status updated to ${status}.`,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update Purchase Order status.'
      });
    }
  };

  receiveOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { warehouseId } = req.body;
      const userId = req.user?.userId;

      if (!warehouseId) {
        res.status(400).json({
          success: false,
          message: 'warehouseId is required to receive stock.'
        });
        return;
      }

      const order = await this.purchaseService.receivePurchaseOrder(id, warehouseId, userId);
      res.status(200).json({
        success: true,
        message: 'Inventory received and updated successfully.',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to receive Purchase Order.'
      });
    }
  };
}
