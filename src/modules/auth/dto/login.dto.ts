import { VALIDATION_ERROR_MAP } from '@common/enums';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: VALIDATION_ERROR_MAP.INVALID_EMAIL })
  email!: string;

  @IsString()
  @MinLength(8, { message: VALIDATION_ERROR_MAP.PASSWORD_MIN_LENGTH })
  password!: string;
}
