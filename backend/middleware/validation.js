// middleware/validation.js - Input Validation & Sanitization
const { body, validationResult } = require('express-validator');
const Joi = require('joi');

// Express-validator middleware for workflow execution
const validateWorkflowExecution = [
  body('nodes').isArray().withMessage('Nodes must be an array'),
  body('nodes.*.id').notEmpty().withMessage('Each node must have an id'),
  body('nodes.*.type').notEmpty().withMessage('Each node must have a type'),
  body('edges').optional().isArray().withMessage('Edges must be an array'),
  body('inputs').optional().isObject().withMessage('Inputs must be an object'),
  body('llmConfig').optional().isObject().withMessage('llmConfig must be an object'),
  body('llmConfig.apiKey').optional().isString().trim().notEmpty().withMessage('API key must be a non-empty string'),
  body('llmConfig.model').optional().isString().trim().withMessage('Model must be a string'),
  body('llmConfig.system').optional().isString().trim().withMessage('System prompt must be a string'),
  body('llmConfig.prompt').optional().isString().trim().withMessage('Prompt must be a string'),
];

// Express-validator middleware for pipeline parse
const validatePipelineParse = [
  body('pipeline').notEmpty().withMessage('Pipeline data is required'),
];

// Validation result handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Joi schema for workflow validation
const workflowSchema = Joi.object({
  nodes: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().required(),
      data: Joi.object().optional(),
      position: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required()
      }).optional()
    })
  ).min(1).required(),
  edges: Joi.array().items(
    Joi.object({
      id: Joi.string().optional(),
      source: Joi.string().required(),
      target: Joi.string().required(),
      sourceHandle: Joi.string().optional(),
      targetHandle: Joi.string().optional()
    })
  ).optional(),
  inputs: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean())
  ).optional(),
  llmConfig: Joi.object({
    apiKey: Joi.string().trim().optional(),
    model: Joi.string().trim().default('gemini-2.0-flash-exp'),
    system: Joi.string().trim().default('You are a helpful assistant.'),
    prompt: Joi.string().trim().optional()
  }).optional()
});

// Joi validation middleware
const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Replace body with sanitized/validated value
    req.body = value;
    next();
  };
};

// Sanitize string inputs to prevent XSS
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Basic XSS prevention
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Deep sanitize object
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

module.exports = {
  validateWorkflowExecution,
  validatePipelineParse,
  handleValidationErrors,
  validateWithJoi,
  workflowSchema,
  sanitizeString,
  sanitizeObject
};
