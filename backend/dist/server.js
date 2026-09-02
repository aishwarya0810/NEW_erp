"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    // Connect to database before starting Express server listeners
    await (0, db_1.connectDB)();
    const server = app_1.default.listen(PORT, () => {
        console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
    // Graceful shutdown handling
    const handleSystemError = (error, type) => {
        console.error(`[CRITICAL] ${type} detected! Shutting down server gracefully...`);
        console.error(error.stack || error.message);
        server.close(() => {
            console.log('Server process terminated.');
            process.exit(1);
        });
    };
    process.on('unhandledRejection', (err) => {
        handleSystemError(err, 'Unhandled Rejection');
    });
    process.on('uncaughtException', (err) => {
        handleSystemError(err, 'Uncaught Exception');
    });
};
startServer();
