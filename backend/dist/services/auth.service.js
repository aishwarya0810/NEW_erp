"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    userRepository;
    tokenRepository;
    hashService;
    constructor(userRepository, tokenRepository, hashService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.hashService = hashService;
    }
    generateAccessToken(payload) {
        const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
        const expires = process.env.JWT_ACCESS_EXPIRATION || '15m';
        return jsonwebtoken_1.default.sign({ ...payload }, secret, { expiresIn: expires });
    }
    generateRefreshToken(payload) {
        const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
        const expires = process.env.JWT_REFRESH_EXPIRATION || '7d';
        return jsonwebtoken_1.default.sign({ ...payload, isRefresh: true }, secret, { expiresIn: expires });
    }
    verifyToken(token) {
        const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
        return jsonwebtoken_1.default.verify(token, secret);
    }
    async register(data) {
        // 1. Verify user doesn't exist
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new Error('Email is already registered.');
        }
        // 2. Resolve Role
        const role = await this.userRepository.findRoleByName(data.roleName.toUpperCase());
        if (!role) {
            throw new Error(`Role '${data.roleName}' does not exist.`);
        }
        // 3. Hash Password
        const passwordHash = await this.hashService.hash(data.password);
        // 4. Create User
        const user = await this.userRepository.create({
            name: data.name,
            email: data.email,
            passwordHash,
            roleId: role.id
        });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: role.name
        };
    }
    async login(data) {
        // 1. Find user
        const user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            throw new Error('Invalid email or password.');
        }
        if (user.status !== 'ACTIVE') {
            throw new Error('Your account is not active. Please contact support.');
        }
        // 2. Validate Password
        const isPasswordValid = await this.hashService.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password.');
        }
        // 3. Extract roles and permissions
        const role = user.role.name;
        const permissions = user.role.permissions.map(rp => rp.permission.name);
        const payload = {
            userId: user.id,
            email: user.email,
            role,
            permissions
        };
        // 4. Generate Tokens
        const accessToken = this.generateAccessToken(payload);
        const refreshTokenStr = this.generateRefreshToken(payload);
        // 5. Store Refresh Token
        const decoded = jsonwebtoken_1.default.decode(refreshTokenStr);
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenRepository.create(user.id, refreshTokenStr, expiresAt);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role
            },
            accessToken,
            refreshToken: refreshTokenStr
        };
    }
    async rotateTokens(token) {
        // 1. Fetch token and join with user
        const storedToken = await this.tokenRepository.findByToken(token);
        if (!storedToken) {
            throw new Error('Invalid or revoked refresh token.');
        }
        if (storedToken.isRevoked) {
            // Security Alert: token reuse detected! Revoke all tokens for this user.
            await this.tokenRepository.revokeAllForUser(storedToken.userId);
            throw new Error('Token reuse detected. All sessions revoked.');
        }
        if (storedToken.expiresAt < new Date()) {
            throw new Error('Refresh token has expired.');
        }
        // 2. Validate token structure via JWT verify
        try {
            this.verifyToken(token);
        }
        catch (err) {
            throw new Error('Refresh token verification failed.');
        }
        const user = storedToken.user;
        if (user.status !== 'ACTIVE') {
            throw new Error('User account is inactive.');
        }
        // 3. Mark old token as revoked
        await this.tokenRepository.revoke(token);
        // 4. Generate new pair
        const role = user.role.name;
        const permissions = user.role.permissions.map(rp => rp.permission.name);
        const payload = {
            userId: user.id,
            email: user.email,
            role,
            permissions
        };
        const accessToken = this.generateAccessToken(payload);
        const newRefreshToken = this.generateRefreshToken(payload);
        // 5. Store new refresh token
        const decoded = jsonwebtoken_1.default.decode(newRefreshToken);
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenRepository.create(user.id, newRefreshToken, expiresAt);
        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    }
    async logout(token) {
        const storedToken = await this.tokenRepository.findByToken(token);
        if (storedToken) {
            await this.tokenRepository.revoke(token);
        }
    }
    async getUsers() {
        return this.userRepository.findAll();
    }
    async getRoles() {
        return this.userRepository.findAllRoles();
    }
    async updateUserRole(userIdToUpdate, roleId) {
        const user = await this.userRepository.findById(userIdToUpdate);
        if (!user) {
            throw new Error('User not found.');
        }
        const role = await this.userRepository.findRoleById(roleId);
        if (!role) {
            throw new Error('Role not found.');
        }
        return this.userRepository.update(userIdToUpdate, {
            role: {
                connect: { id: roleId }
            }
        });
    }
}
exports.AuthService = AuthService;
