"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = (req, res, next) => {
    let token;
    // Extract Bearer token from headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Not authorized, access token is missing.'
        });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Verify it is not a refresh token
        if (decoded.isRefresh) {
            res.status(401).json({
                success: false,
                message: 'Not authorized, invalid token category.'
            });
            return;
        }
        // Set user on request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized, token is invalid or expired.'
        });
    }
};
exports.protect = protect;
