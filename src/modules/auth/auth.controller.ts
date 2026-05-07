import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './types/auth-response.type';
import { RefreshToken } from '@common/decorators';
import { VALIDATION_ERROR_MAP } from '@common/enums';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { User } from '@prisma-generated/prisma/client';

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
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.USER_NOT_FOUND);
    }

    return this.authService.refresh(refreshToken, response);
  }

  @Post('logout')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  logout(@RefreshToken() refreshToken: string, @Res({ passthrough: true }) response: Response) {
    return this.authService.logout(refreshToken, response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request & { user: { id: string; slug: string } }) {
    return req.user;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request & { user: User }, @Res() response: Response) {
    // req.user — это то что вернул validate() в GoogleStrategy
    // Генерируем свои токены и редиректим на фронт
    const { access_token } = await this.authService.generateTokenResponse(
      req.user,
      response, // для установки refresh_token в cookie
    );

    // Редиректим на фронт с access_token в URL
    // Фронт прочитает его из URL и сохранит
    response.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${access_token}`);
  }
}
