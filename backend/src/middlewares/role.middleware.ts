import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict route access by User Role
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Middleware to restrict route access by User Permissions
 */
export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated.'
      });
      return;
    }

    const hasPermission = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );

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
