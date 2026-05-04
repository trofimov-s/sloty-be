import * as Joi from 'joi';
import { ConfigModuleOptions } from '@nestjs/config';

export const appConfig: ConfigModuleOptions = {
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
  isGlobal: true,
  cache: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production').default('development'),
    PORT: Joi.number().default(3000),
    FRONTEND_URL: Joi.string().required(),
    DATABASE_URL: Joi.string().required(),
    ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
    REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  }),
};
