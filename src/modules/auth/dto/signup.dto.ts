import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

import { VALIDATION_ERROR_MAP } from '@common/enums';

export class SignupDto {
  @IsString()
  @MinLength(2, { message: VALIDATION_ERROR_MAP.USERNAME_MIN_LENGTH })
  name!: string;

  @IsEmail({}, { message: VALIDATION_ERROR_MAP.INVALID_EMAIL })
  email!: string;

  @IsString()
  @MinLength(8, { message: VALIDATION_ERROR_MAP.PASSWORD_MIN_LENGTH })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, { message: VALIDATION_ERROR_MAP.PASSWORD_PATTERN })
  password!: string;
}
