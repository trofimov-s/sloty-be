import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const RefreshToken = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest() as Request;
  const refreshToken = request.cookies?.refresh_token;

  return refreshToken;
});
