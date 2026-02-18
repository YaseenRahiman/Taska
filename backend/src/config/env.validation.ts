import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Email (optional for development)
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASSWORD: Joi.string().optional(),
  EMAIL_FROM: Joi.string().optional(),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  UPLOAD_DIR: Joi.string().default('./uploads'),

  // Payment (optional for development)
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  PAYFAST_MERCHANT_ID: Joi.string().allow('').optional(),
  PAYFAST_MERCHANT_KEY: Joi.string().allow('').optional(),
  PAYFAST_PASSPHRASE: Joi.string().allow('').optional(),

  // MCP Servers (optional)
  MCP_SEQUENTIAL_URL: Joi.string().optional(),
  MCP_CONTEXT7_URL: Joi.string().optional(),
  MCP_MAGIC_URL: Joi.string().optional(),

  // Optional Services
  SENTRY_DSN: Joi.string().optional(),
  GOOGLE_MAPS_API_KEY: Joi.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),
  FRONTEND_URL: Joi.string().default('http://localhost:3001'),
});
