import dotenv from 'dotenv';
// Load environment variables before any other imports to prevent Prisma DB url missing error during import-hoisting
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import warehouseRoutes from './routes/warehouse.routes';
import purchaseRoutes from './routes/purchase.routes';
import salesRoutes from './routes/sales.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middlewares/error.middleware';
dotenv.config();

const app = express();

// Apply Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);

// Performance / Body Parsing Middlewares
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie_secret_fallback'));

// Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Stockpilot ERP Backend API is fully operational.',
    timestamp: new Date()
  });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/purchasing', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
