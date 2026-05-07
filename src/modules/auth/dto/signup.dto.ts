import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

import { VALIDATION_ERROR_MAP } from '@common/enums';

export class SignupDto {
  @IsString()
  @MinLength(2, { message: VALIDATION_ERROR_MAP.FIRST_NAME_MIN_LENGTH })
  first_name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: VALIDATION_ERROR_MAP.LAST_NAME_MIN_LENGTH })
  last_name?: string;

  @IsEmail({}, { message: VALIDATION_ERROR_MAP.INVALID_EMAIL })
  email!: string;

  @IsString()
  @MinLength(8, { message: VALIDATION_ERROR_MAP.PASSWORD_MIN_LENGTH })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, { message: VALIDATION_ERROR_MAP.PASSWORD_PATTERN })
  password!: string;
}
