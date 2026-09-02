"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermissions = exports.requireRoles = void 0;
/**
 * Middleware to restrict route access by User Role
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated.'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient privileges.'
            });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Middleware to restrict route access by User Permissions
 */
const requirePermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated.'
            });
            return;
        }
        const hasPermission = requiredPermissions.every(permission => req.user.permissions.includes(permission));
        if (!hasPermission) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: Missing required permissions.'
            });
            return;
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
