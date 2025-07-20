import { Controller, Post, Body, UnauthorizedException, Patch, Param, Logger, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../app/user/user.service';

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

interface UpdatePasswordDto {
  newPassword: string;
}

interface RefreshTokenDto {
  refresh_token: string;
}

@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(UserService) private readonly userService: UserService
  ) {
    this.logger.log('AuthController initialized');
  }

  @Post('login')
  async login(@Body() credentials: LoginCredentials): Promise<AuthResponse> {
    this.logger.log('Login endpoint hit');
    this.logger.log('Received credentials:', credentials);
    
    try {
      const result = await this.authService.login(credentials);
      this.logger.log('Login successful');
      return result;
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('logout')
  async logout() {
    // For now, we'll just return a success message
    // In a real app, you might want to invalidate the token on the server
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    this.logger.log('Refresh token endpoint hit');
    
    try {
      const result = await this.authService.refreshToken(refreshTokenDto);
      this.logger.log('Token refresh successful');
      return result;
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Patch('update-password/:email')
  async updatePassword(
    @Param('email') email: string,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    const user = await this.userService.findByUsername(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.userService.updateUser(user.id, { password: updatePasswordDto.newPassword });
    return { message: 'Password updated successfully' };
  }
} 