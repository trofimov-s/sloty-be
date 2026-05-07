import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback, type Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

import { ENV_MAP } from '@common/enums';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>(ENV_MAP.GOOGLE_CLIENT_ID),
      clientSecret: configService.getOrThrow<string>(ENV_MAP.GOOGLE_CLIENT_SECRET),
      callbackURL: configService.getOrThrow<string>(ENV_MAP.GOOGLE_CALLBACK_URL),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    googleAccessToken: string, // токен для запросов к Google API (нам не нужен)
    googleRefreshToken: string, // для обновления Google токена (нам не нужен)
    profile: Profile, // данные пользователя — вот что нам нужно
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, name, photos } = profile;

    const result = await this.authService.findOrCreateGoogleUser({
      googleId: id,
      email: emails![0].value,
      first_name: name?.givenName,
      last_name: name?.familyName,
      avatar_url: photos?.[0].value,
    });

    done(null, result);
  }
}
