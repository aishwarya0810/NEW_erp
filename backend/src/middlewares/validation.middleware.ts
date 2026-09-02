import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse request segments matching the validation schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.slice(1).join('.') || issue.path.join('.'),
            message: issue.message
          }))
        });
        return;
      }
      next(error);
    }
  };
};
