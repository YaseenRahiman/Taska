import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService, AuthTokens } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully with authentication tokens and user data',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        expiresIn: { type: 'number', example: 3600 },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxx123456789' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', example: 'CLIENT' },
            verifiedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                phoneNumber: { type: 'string', example: '+27123456789' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthTokens> {
    return this.authService.register(registerDto, ipAddress, userAgent || 'Unknown');
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid token or already verified' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful with authentication tokens and user data',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        expiresIn: { type: 'number', example: 86400 },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxx123456789' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', example: 'CLIENT' },
            verifiedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                phoneNumber: { type: 'string', example: '+27123456789' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials or unverified email' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited due to failed attempts' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthTokens> {
    return this.authService.login(loginDto, ipAddress, userAgent || 'Unknown');
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      },
      required: ['refreshToken']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        expiresIn: { type: 'number', example: 86400 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid refresh token' })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Ip() ipAddress: string,
  ): Promise<AuthTokens> {
    return this.authService.refreshToken(refreshToken, ipAddress);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid current password or validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' }
      },
      required: ['email']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset request processed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'If the email exists, a password reset link has been sent.' }
      }
    }
  })
  async requestPasswordReset(@Body('email') email: string): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', example: 'device-uuid-12345' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  async logout(
    @CurrentUser() user: User,
    @Body('deviceId') deviceId?: string,
  ): Promise<{ message: string }> {
    return this.authService.logout(user.id, deviceId);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // Guard redirects to Google automatically
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    const tokens = await this.authService.validateOrCreateGoogleUser(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: String(tokens.expiresIn),
    });
    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clxxx123456789' },
        email: { type: 'string', example: 'user@example.com' },
        role: { type: 'string', example: 'CLIENT' },
        verifiedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        profile: {
          type: 'object',
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phoneNumber: { type: 'string', example: '+27123456789' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  getProfile(@CurrentUser() user: User): Omit<User, 'passwordHash'> {
    // Remove sensitive information before returning
    const { passwordHash, ...profile } = user;
    return profile;
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clxxx123456789' },
          ipAddress: { type: 'string', example: '192.168.1.1' },
          userAgent: { type: 'string', example: 'Mozilla/5.0...' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  async getSessions(@CurrentUser() user: User) {
    return this.authService.getActiveSessions(user.id);
  }

  @Post('sessions/:sessionId/terminate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate a specific session' })
  @ApiResponse({
    status: 200,
    description: 'Session terminated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Session terminated successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  async terminateSession(
    @CurrentUser() user: User,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const sessionId = req.params.sessionId;
    return this.authService.terminateSession(user.id, sessionId);
  }

  @Post('sessions/terminate-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate all other sessions (logout all devices)' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        currentSessionId: { type: 'string', example: 'clxxx123456789', description: 'Current session to keep active' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'All other sessions terminated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '3 session(s) terminated successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  async terminateAllSessions(
    @CurrentUser() user: User,
    @Body('currentSessionId') currentSessionId?: string,
  ): Promise<{ message: string }> {
    return this.authService.terminateAllSessions(user.id, currentSessionId);
  }
}
