import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { HashService } from './hash.service';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private tokenRepository: RefreshTokenRepository,
    private hashService: HashService
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
    const expires = process.env.JWT_ACCESS_EXPIRATION || '15m';
    return jwt.sign({ ...payload }, secret, { expiresIn: expires } as jwt.SignOptions);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
    const expires = process.env.JWT_REFRESH_EXPIRATION || '7d';
    return jwt.sign({ ...payload, isRefresh: true }, secret, { expiresIn: expires } as jwt.SignOptions);
  }

  verifyToken(token: string): any {
    const secret = process.env.JWT_SECRET || 'super_secret_key_change_me_in_production_12345';
    return jwt.verify(token, secret);
  }

  async register(data: { name: string; email: string; password: string; roleName: string }) {
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

  async login(data: { email: string; password: string }) {
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

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role,
      permissions
    };

    // 4. Generate Tokens
    const accessToken = this.generateAccessToken(payload);
    const refreshTokenStr = this.generateRefreshToken(payload);

    // 5. Store Refresh Token
    const decoded = jwt.decode(refreshTokenStr) as any;
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

  async rotateTokens(token: string) {
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
    } catch (err) {
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

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role,
      permissions
    };

    const accessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    // 5. Store new refresh token
    const decoded = jwt.decode(newRefreshToken) as any;
    const expiresAt = new Date(decoded.exp * 1000);
    await this.tokenRepository.create(user.id, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(token: string) {
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

  async updateUserRole(userIdToUpdate: string, roleId: string) {
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
