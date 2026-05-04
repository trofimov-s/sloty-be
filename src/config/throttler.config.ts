import { type ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 1000, // 1 second
    limit: 3, // maximum 3 requests
  },
  {
    name: 'long',
    ttl: 60000, // 1 minute
    limit: 20, // maximum 20 requests
  },
];
