"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
class WarehouseController {
    warehouseService;
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }
    getWarehouses = async (req, res, next) => {
        try {
            const warehouses = await this.warehouseService.getWarehouses();
            res.status(200).json({
                success: true,
                data: warehouses
            });
        }
        catch (error) {
            next(error);
        }
    };
    getWarehouseById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const warehouse = await this.warehouseService.getWarehouseById(id);
            res.status(200).json({
                success: true,
                data: warehouse
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message || 'Warehouse not found.'
            });
        }
    };
    createWarehouse = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const warehouse = await this.warehouseService.createWarehouse(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Warehouse created successfully.',
                data: warehouse
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Warehouse creation failed.'
            });
        }
    };
    updateWarehouse = async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            const warehouse = await this.warehouseService.updateWarehouse(id, req.body, userId);
            res.status(200).json({
                success: true,
                message: 'Warehouse updated successfully.',
                data: warehouse
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Warehouse update failed.'
            });
        }
    };
    deleteWarehouse = async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            await this.warehouseService.deleteWarehouse(id, userId);
            res.status(200).json({
                success: true,
                message: 'Warehouse deleted successfully.'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Warehouse deletion failed.'
            });
        }
    };
    getWarehouseStock = async (req, res, next) => {
        try {
            const id = req.params.id;
            const stock = await this.warehouseService.getWarehouseStock(id);
            res.status(200).json({
                success: true,
                data: stock
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to retrieve stock levels.'
            });
        }
    };
    transferStock = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const result = await this.warehouseService.transferStock(req.body, userId);
            res.status(200).json({
                success: true,
                message: 'Stock transferred successfully.',
                data: result
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Stock transfer failed.'
            });
        }
    };
}
exports.WarehouseController = WarehouseController;
