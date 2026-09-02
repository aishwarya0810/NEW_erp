import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from '../services/warehouse.service';

export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  getWarehouses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warehouses = await this.warehouseService.getWarehouses();
      res.status(200).json({
        success: true,
        data: warehouses
      });
    } catch (error: any) {
      next(error);
    }
  };

  getWarehouseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const warehouse = await this.warehouseService.getWarehouseById(id);
      res.status(200).json({
        success: true,
        data: warehouse
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Warehouse not found.'
      });
    }
  };

  createWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const warehouse = await this.warehouseService.createWarehouse(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Warehouse created successfully.',
        data: warehouse
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Warehouse creation failed.'
      });
    }
  };

  updateWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const warehouse = await this.warehouseService.updateWarehouse(id, req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Warehouse updated successfully.',
        data: warehouse
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Warehouse update failed.'
      });
    }
  };

  deleteWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      await this.warehouseService.deleteWarehouse(id, userId);
      res.status(200).json({
        success: true,
        message: 'Warehouse deleted successfully.'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Warehouse deletion failed.'
      });
    }
  };

  getWarehouseStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const stock = await this.warehouseService.getWarehouseStock(id);
      res.status(200).json({
        success: true,
        data: stock
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve stock levels.'
      });
    }
  };

  transferStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const result = await this.warehouseService.transferStock(req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Stock transferred successfully.',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Stock transfer failed.'
      });
    }
  };
}
