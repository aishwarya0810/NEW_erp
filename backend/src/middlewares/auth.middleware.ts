import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

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
    const decoded = jwt.verify(token, secret) as any;

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
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, token is invalid or expired.'
    });
  }
};
