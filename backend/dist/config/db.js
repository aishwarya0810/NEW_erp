"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.prisma = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
}
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({ adapter });
const connectDB = async () => {
    try {
        // Execute a simple query to verify connection
        await exports.prisma.$queryRaw `SELECT 1`;
        console.log('PostgreSQL Connected via Prisma Client Adapter successfully.');
    }
    catch (error) {
        console.error('PostgreSQL Connection Error:', error.message);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
