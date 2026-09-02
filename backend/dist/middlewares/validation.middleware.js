"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Parse request segments matching the validation schema
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validate = validate;
