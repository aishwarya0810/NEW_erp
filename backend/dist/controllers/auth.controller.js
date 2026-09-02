"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authService;
    auditRepository;
    constructor(authService, auditRepository) {
        this.authService = authService;
        this.auditRepository = auditRepository;
    }
    register = async (req, res, next) => {
        try {
            const result = await this.authService.register(req.body);
            // Write security audit log
            await this.auditRepository.createLog({
                action: 'USER_REGISTER',
                newValue: { email: result.email, role: result.role },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            res.status(201).json({
                success: true,
                message: 'User registered successfully.',
                data: result
            });
        }
        catch (error) {
            // Return 400 status for known registration/validation business errors
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed.'
            });
        }
    };
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login({ email, password });
            // Configure secure HttpOnly cookie for Refresh Token
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching token expiration
            });
            // Write login audit log
            await this.auditRepository.createLog({
                userId: result.user.id,
                action: 'USER_LOGIN',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: {
                    user: result.user,
                    accessToken: result.accessToken
                }
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid credentials.'
            });
        }
    };
    refresh = async (req, res, next) => {
        try {
            // Extract refresh token from cookies
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is missing from cookies.'
                });
                return;
            }
            const result = await this.authService.rotateTokens(refreshToken);
            // Set rotated refresh token in cookie
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({
                success: true,
                message: 'Access token refreshed successfully.',
                data: {
                    accessToken: result.accessToken
                }
            });
        }
        catch (error) {
            // Clear cookie if session rotation failed/token was compromised
            res.clearCookie('refreshToken');
            res.status(401).json({
                success: false,
                message: error.message || 'Token refresh failed.'
            });
        }
    };
    logout = async (req, res, next) => {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                await this.authService.logout(refreshToken);
            }
            // Clear cookie on client
            res.clearCookie('refreshToken');
            // Write logout audit log if user context exists
            if (req.user) {
                await this.auditRepository.createLog({
                    userId: req.user.userId,
                    action: 'USER_LOGOUT',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });
            }
            res.status(200).json({
                success: true,
                message: 'Logout successful.'
            });
        }
        catch (error) {
            next(error);
        }
    };
    getMe = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully.',
                data: {
                    user: req.user
                }
            });
        }
        catch (error) {
            next(error);
        }
    };
    getUsers = async (req, res, next) => {
        try {
            const users = await this.authService.getUsers();
            res.status(200).json({
                success: true,
                data: users
            });
        }
        catch (error) {
            next(error);
        }
    };
    getRoles = async (req, res, next) => {
        try {
            const roles = await this.authService.getRoles();
            res.status(200).json({
                success: true,
                data: roles
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateUserRole = async (req, res, next) => {
        try {
            const userIdToUpdate = req.params.id;
            const { roleId } = req.body;
            const userId = req.user?.userId;
            const updated = await this.authService.updateUserRole(userIdToUpdate, roleId);
            await this.auditRepository.createLog({
                userId,
                action: 'UPDATE_USER_ROLE',
                newValue: { userId: updated.id, role: updated.role.name }
            });
            res.status(200).json({
                success: true,
                message: 'User role updated successfully.',
                data: updated
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update user role.'
            });
        }
    };
}
exports.AuthController = AuthController;
