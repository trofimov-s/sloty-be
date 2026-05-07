import { VALIDATION_ERROR_MAP } from '@common/enums';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Переопределяем handleRequest чтобы дать понятную ошибку
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // info содержит причину — TokenExpiredError, JsonWebTokenError и тд
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(VALIDATION_ERROR_MAP.TOKEN_EXPIRED);
      }

      throw new UnauthorizedException(VALIDATION_ERROR_MAP.INVALID_TOKEN);
    }

    return user;
  }
}
