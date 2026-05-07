import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { type Response } from 'express';
import { slugify } from 'transliteration';

import { PrismaService } from '@prisma-service';
import { UsersService } from '../users';
import { SignupDto } from './dto/signup.dto';
import { User } from '@prisma-generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './types/auth-response.type';
import { ENV_MAP, VALIDATION_ERROR_MAP } from '@common/enums';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './types/jwt-payload.type';
import { GoogleUserData } from './types/google-user-data.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto, response: Response): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);

    // Check email is free
    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      throw new ConflictException(VALIDATION_ERROR_MAP.USER_WITH_THIS_EMAIL_ALREADY_EXISTS);
    }

    // Generate custom slug
    const fullName = [dto.first_name, dto.last_name].filter(Boolean).join(' ');
    const slug = await this.generateSlug(fullName);

    // Password hashing
    const password_hash = await bcrypt.hash(dto.password, 12);

    // Create User and AuthProvider in one transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          email,
          slug,
        },
      });

      await tx.authProvider.create({
        data: {
          user_id: newUser.id,
          provider: 'email',
          provider_id: email,
          password_hash,
        },
      });

      return newUser;
    });

    // 4. Create and return JWT token
    return this.generateTokenResponse(user, response);
  }

  async login(dto: LoginDto, response: Response): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);

    // 1. Searching for a user by email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.INVALID_EMAIL_OR_PASSWORD);
    }

    // 2. Searching for an auth_provider
    const authProvider = await this.prisma.authProvider.findFirst({
      where: {
        user_id: user.id,
        provider: 'email',
      },
    });

    // User exists but was created by using not login/email flow, but some another flow e.g. Google Auth. User does not have password.
    if (!authProvider || !authProvider.password_hash) {
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.ACCOUNT_USES_ANOTHER_AUTH_PROVIDER);
    }

    // 3. Validate password
    const isPasswordValid = await bcrypt.compare(dto.password, authProvider.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.INVALID_EMAIL_OR_PASSWORD);
    }

    return this.generateTokenResponse(user, response);
  }

  async findOrCreateGoogleUser(data: GoogleUserData) {
    const existingProvider = await this.prisma.authProvider.findUnique({
      where: {
        provider_provider_id: {
          provider: 'google',
          provider_id: data.googleId,
        },
      },
      include: { user: true },
    });

    // Уже логинился через Google — просто возвращаем данные
    if (existingProvider) {
      return existingProvider.user;
    }

    // 2. Может уже есть аккаунт с таким email (зарегался через email ранее)?
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      // Account linking — добавляем Google как ещё один способ входа
      await this.prisma.authProvider.create({
        data: {
          user_id: existingUser.id,
          provider: 'google',
          provider_id: data.googleId,
        },
      });

      return existingUser;
    }

    // 3. Совсем новый пользователь — создаём
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
    const slug = await this.generateSlug(fullName);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          first_name: data.first_name ?? 'User',
          last_name: data.last_name,
          slug,
          avatar_url: data.avatar_url,
          is_email_verified: true,
        },
      });

      await tx.authProvider.create({
        data: {
          provider: 'google',
          provider_id: data.googleId,
          user_id: user.id,
        },
      });

      return user;
    });

    return newUser;
  }

  async refresh(refreshToken: string, response: Response): Promise<AuthResponse> {
    // 1. Searching for a token in DB
    const tokenRecord = await this.prisma.refreshToken
      .delete({
        where: { token: refreshToken },
        include: { user: true }, // additionally take a user
      })
      .catch(() => null);

    // 2. Токен не найден — либо уже использован, либо поддельный
    if (!tokenRecord) {
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.USER_NOT_FOUND);
    }

    // 3. Проверяем что токен не протух
    if (tokenRecord.expires_at < new Date()) {
      // Удаляем протухший токен из БД — чистота важна
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.USER_NOT_FOUND);
    }

    // 4. Выдаём новую пару токенов
    return this.generateTokenResponse(tokenRecord.user, response);
  }

  async logout(refreshToken: string, response: Response): Promise<{ message: string }> {
    // Удаляем токен из БД — сессия завершена
    // Если токен не найден — не бросаем ошибку, просто игнорируем
    // Пользователь всё равно разлогинится на фронте
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    // Очищаем cookie
    response.clearCookie('refresh_token', this.getCookieOptions());

    return { message: 'Вышли успешно' };
  }

  async generateTokenResponse(user: User, response: Response): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow(ENV_MAP.ACCESS_TOKEN_SECRET),
      expiresIn: this.configService.getOrThrow(ENV_MAP.JWT_ACCESS_EXPIRES_IN),
    });

    // Генерируем refresh token — просто случайная строка, не JWT
    // Почему не JWT? Потому что refresh token хранится в БД и проверяется по значению.
    // Нет смысла делать его JWT — вся валидация идёт через БД
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');

    // Считаем когда протухнет — 30 дней от сейчас
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        expires_at: expiresAt,
        user_id: user.id,
        token: refreshTokenValue,
      },
    });

    // Кладём refresh token в httpOnly cookie
    response.cookie('refresh_token', refreshTokenValue, this.getCookieOptions());

    // Возвращаем только access token в теле ответа
    return {
      access_token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        slug: user.slug,
      },
    };
  }

  // Выносим опции cookie в отдельный метод — используется в нескольких местах
  private getCookieOptions() {
    const isProduction = this.configService.get(ENV_MAP.NODE_ENV) === 'production';

    return {
      httpOnly: true, // JavaScript не может прочитать cookie
      secure: isProduction, // только HTTPS на продакшне, HTTP разрешён локально
      sameSite: isProduction ? ('none' as const) : ('lax' as const), // защита от CSRF атак
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней в миллисекундах
      path: '/',
    };
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  // Генерируем slug автоматически из имени
  private async generateSlug(name: string): Promise<string> {
    const base =
      slugify(name.trim(), {
        lowercase: true,
        separator: '-',
      }) || `master-${crypto.randomBytes(4).toString('hex')}`;

    let slug = base;
    let counter = 1;

    while (await this.usersService.findBySlug(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }
}
