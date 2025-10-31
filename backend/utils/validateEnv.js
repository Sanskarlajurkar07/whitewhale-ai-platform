// utils/validateEnv.js - Environment Variable Validation
const Joi = require('joi');

const envSchema = Joi.object({
  PORT: Joi.number().default(8000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  GOOGLE_API_KEY: Joi.string().optional(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown();

function validateEnv() {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  
  // Warn if API key is missing
  if (!value.GOOGLE_API_KEY) {
    console.warn('⚠️  Warning: GOOGLE_API_KEY not found in environment variables.');
    console.warn('   Users will need to provide their own API keys when executing workflows.');
  }
  
  return value;
}

module.exports = { validateEnv };
