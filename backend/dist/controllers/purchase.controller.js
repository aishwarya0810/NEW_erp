"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseController = void 0;
class PurchaseController {
    purchaseService;
    constructor(purchaseService) {
        this.purchaseService = purchaseService;
    }
    // Suppliers
    getSuppliers = async (req, res, next) => {
        try {
            const suppliers = await this.purchaseService.getSuppliers();
            res.status(200).json({
                success: true,
                data: suppliers
            });
        }
        catch (error) {
            next(error);
        }
    };
    getSupplierById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const supplier = await this.purchaseService.getSupplierById(id);
            res.status(200).json({
                success: true,
                data: supplier
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message || 'Supplier not found.'
            });
        }
    };
    createSupplier = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const supplier = await this.purchaseService.createSupplier(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Supplier created successfully.',
                data: supplier
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Supplier creation failed.'
            });
        }
    };
    updateSupplier = async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            const supplier = await this.purchaseService.updateSupplier(id, req.body, userId);
            res.status(200).json({
                success: true,
                message: 'Supplier updated successfully.',
                data: supplier
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Supplier update failed.'
            });
        }
    };
    deleteSupplier = async (req, res, next) => {
        try {
            const id = req.params.id;
            const userId = req.user?.userId;
            await this.purchaseService.deleteSupplier(id, userId);
            res.status(200).json({
                success: true,
                message: 'Supplier deleted successfully.'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Supplier deletion failed.'
            });
        }
    };
    // Purchase Orders
    getPurchaseOrders = async (req, res, next) => {
        try {
            const status = req.query.status;
            const supplierId = req.query.supplierId;
            const orders = await this.purchaseService.getPurchaseOrders({ status, supplierId });
            res.status(200).json({
                success: true,
                data: orders
            });
        }
        catch (error) {
            next(error);
        }
    };
    getPurchaseOrderById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const order = await this.purchaseService.getPurchaseOrderById(id);
            res.status(200).json({
                success: true,
                data: order
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message || 'Purchase Order not found.'
            });
        }
    };
    createPurchaseOrder = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const order = await this.purchaseService.createPurchaseOrder(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Purchase Order created successfully.',
                data: order
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Purchase Order creation failed.'
            });
        }
    };
    updateStatus = async (req, res, next) => {
        try {
            const id = req.params.id;
            const { status } = req.body;
            const userId = req.user?.userId;
            const order = await this.purchaseService.updatePurchaseOrderStatus(id, status, userId);
            res.status(200).json({
                success: true,
                message: `Purchase Order status updated to ${status}.`,
                data: order
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update Purchase Order status.'
            });
        }
    };
    receiveOrder = async (req, res, next) => {
        try {
            const id = req.params.id;
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to receive Purchase Order.'
            });
        }
    };
}
exports.PurchaseController = PurchaseController;
