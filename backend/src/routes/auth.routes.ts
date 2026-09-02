import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { HashService } from '../services/hash.service';
import { AuditRepository } from '../repositories/audit.repository';
import { validate } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { protect } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

// Instantiate Layer dependencies (Dependency Injection)
const userRepository = new UserRepository();
const tokenRepository = new RefreshTokenRepository();
const auditRepository = new AuditRepository();
const hashService = new HashService();
const authService = new AuthService(userRepository, tokenRepository, hashService);
const authController = new AuthController(authService, auditRepository);

// Wire API Endpoints to Middlewares and Handlers
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, requireRoles('ADMIN'), authController.getUsers);
router.get('/roles', protect, requireRoles('ADMIN'), authController.getRoles);
router.patch('/users/:id/role', protect, requireRoles('ADMIN'), authController.updateUserRole);

export default router;
