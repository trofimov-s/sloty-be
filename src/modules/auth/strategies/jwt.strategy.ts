import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users';
import { JwtPayload } from '../types/jwt-payload.type';
import { User } from '@prisma-generated/prisma/client';
import { ENV_MAP, VALIDATION_ERROR_MAP } from '@common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Говорим откуда брать токен — из заголовка Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Автоматически отклоняет просроченные токены
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(ENV_MAP.ACCESS_TOKEN_SECRET),
    });
  }

  // Этот метод вызывается автоматически после того как токен прошёл проверку подписи
  // payload — это то что мы положили в токен при создании { sub, email }
  // Результат этого метода кладётся в req.user
  async validate(payload: JwtPayload): Promise<Pick<User, 'id' | 'slug'>> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      // Токен валидный но юзер удалён из БД
      throw new UnauthorizedException(VALIDATION_ERROR_MAP.USER_NOT_FOUND);
    }

    // Это и есть req.user в контроллере
    return { id: user.id, slug: user.slug };
  }
}
