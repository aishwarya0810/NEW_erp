"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    // Log error stack trace in development
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[API Error] ${status} - ${message}`);
        if (err.stack) {
            console.error(err.stack);
        }
    }
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
