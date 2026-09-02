import { Request, Response, NextFunction } from 'express';
import { SalesService } from '../services/sales.service';

export class SalesController {
  constructor(private salesService: SalesService) {}

  // Customers
  getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customers = await this.salesService.getCustomers();
      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      next(error);
    }
  };

  getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const customer = await this.salesService.getCustomerById(id);
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Customer not found.'
      });
    }
  };

  createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const customer = await this.salesService.createCustomer(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Customer created successfully.',
        data: customer
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Customer creation failed.'
      });
    }
  };

  updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const customer = await this.salesService.updateCustomer(id, req.body, userId);
      res.status(200).json({
        success: true,
        message: 'Customer updated successfully.',
        data: customer
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Customer update failed.'
      });
    }
  };

  // Sales Orders
  getSalesOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string;
      const customerId = req.query.customerId as string;
      const orders = await this.salesService.getSalesOrders({ status, customerId });
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      next(error);
    }
  };

  getSalesOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const order = await this.salesService.getSalesOrderById(id);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Sales Order not found.'
      });
    }
  };

  createSalesOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const order = await this.salesService.createSalesOrder(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Sales Order created successfully.',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Sales Order creation failed.'
      });
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = req.user?.userId;
      const order = await this.salesService.updateSalesOrderStatus(id, status, userId);
      res.status(200).json({
        success: true,
        message: `Sales Order status updated to ${status}.`,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update Sales Order status.'
      });
    }
  };

  shipOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { warehouseId } = req.body;
      const userId = req.user?.userId;

      if (!warehouseId) {
        res.status(400).json({
          success: false,
          message: 'warehouseId is required to ship sales order.'
        });
        return;
      }

      const order = await this.salesService.shipSalesOrder(id, warehouseId, userId);
      res.status(200).json({
        success: true,
        message: 'Sales Order shipped and inventory deducted successfully.',
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to ship Sales Order.'
      });
    }
  };
}
