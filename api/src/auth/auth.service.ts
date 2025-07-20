import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../app/user/user.service';
import * as bcrypt from 'bcrypt';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

interface RefreshTokenDto {
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {
    this.logger.log('AuthService initialized');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.logger.log('Login method called');
    this.logger.log('Login credentials:', credentials);
    
    // Find user by username (which could be email)
    const user = await this.userService.findByUsername(credentials.username);
    this.logger.log('User found:', user);
    
    if (!user) {
      this.logger.warn(`Login attempt failed: User not found for username ${credentials.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: Invalid password for user ${credentials.username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug('Password validation successful');

    // Generate tokens
    const payload = { sub: user.id, username: user.email };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }), // Longer expiration for refresh token
    ]);

    this.logger.debug('Tokens generated successfully');

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<Omit<AuthResponse, 'user'>> {
    this.logger.log('Refresh token method called');

    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refresh_token);
      
      // Find the user
      const user = await this.userService.findByUsername(payload.username);
      if (!user) {
        this.logger.warn(`Refresh token failed: User not found for username ${payload.username}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newPayload = { sub: user.id, username: user.email };
      const [access_token, refresh_token] = await Promise.all([
        this.jwtService.signAsync(newPayload),
        this.jwtService.signAsync(newPayload, { expiresIn: '7d' }),
      ]);

      this.logger.debug('New tokens generated successfully');

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      this.logger.error('Refresh token failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 