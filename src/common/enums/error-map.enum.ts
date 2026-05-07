export enum VALIDATION_ERROR_MAP {
  // Auth
  INVALID_EMAIL = 'invalid_email_error',
  PASSWORD_MIN_LENGTH = 'password_min_length_error',
  PASSWORD_PATTERN = 'password_pattern_error',
  FIRST_NAME_MIN_LENGTH = 'first_name_min_length_error',
  LAST_NAME_MIN_LENGTH = 'last_name_min_length_error',
  INVALID_EMAIL_OR_PASSWORD = 'invalid_email_or_password_error',
  ACCOUNT_USES_ANOTHER_AUTH_PROVIDER = 'account_uses_another_auth_provider_error',
  USER_WITH_THIS_EMAIL_ALREADY_EXISTS = 'user_with_this_email_already_exist',

  // 401
  USER_NOT_FOUND = 'user_not_found_error',
  TOKEN_EXPIRED = 'token_expired_error',
  INVALID_TOKEN = 'invalid_token_error',
}
