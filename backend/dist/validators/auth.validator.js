"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters.'),
        email: zod_1.z.string().email('Invalid email address.'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters.'),
        roleName: zod_1.z.enum(['ADMIN', 'MANAGER', 'INVENTORY_STAFF', 'SALES_STAFF', 'WAREHOUSE_MANAGER'])
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address.'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters.')
    })
});
