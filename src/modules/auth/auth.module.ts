import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { UsersModule } from '../users';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, GoogleStrategy, GoogleAuthGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
