import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './types/auth-response.type';
import { RefreshToken } from '@common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response): Promise<AuthResponse> {
    return this.authService.signup(dto, response);
  }

  @Post('login')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<AuthResponse> {
    return this.authService.login(dto, response);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token does not exist');
    }

    return this.authService.refresh(refreshToken, response);
  }

  @Post('logout')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  logout(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response) {
    return this.authService.logout(refreshToken, response);
  }
}
