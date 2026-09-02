import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.get('/summary', protect, dashboardController.getSummary);

export default router;
