"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before any other imports to prevent Prisma DB url missing error during import-hoisting
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const warehouse_routes_1 = __importDefault(require("./routes/warehouse.routes"));
const purchase_routes_1 = __importDefault(require("./routes/purchase.routes"));
const sales_routes_1 = __importDefault(require("./routes/sales.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Apply Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
// Performance / Body Parsing Middlewares
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)(process.env.COOKIE_SECRET || 'cookie_secret_fallback'));
// Base Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Stockpilot ERP Backend API is fully operational.',
        timestamp: new Date()
    });
});
// App Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/warehouses', warehouse_routes_1.default);
app.use('/api/purchasing', purchase_routes_1.default);
app.use('/api/sales', sales_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// 404 Route Fallback
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Resource not found: ${req.method} ${req.originalUrl}`
    });
});
// Global Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
