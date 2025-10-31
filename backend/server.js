// server.js - Express Backend with Google Gemini API Integration
// Enhanced with security, validation, caching, and structured logging

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Utilities and middleware
const { validateEnv } = require('./utils/validateEnv');
const logger = require('./utils/logger');
const {
  validateWorkflowExecution,
  validatePipelineParse,
  handleValidationErrors,
  validateWithJoi,
  workflowSchema
} = require('./middleware/validation');

// Validate environment variables
const env = validateEnv();

const app = express();
const PORT = env.PORT || 8000;

// CORS Configuration - FLEXIBLE FOR MULTIPLE DEPLOYMENTS
const corsOptions = {
  origin: [
    // Local development
    'http://localhost:3000',
    'http://localhost:5173',
    
    // Vercel deployments
    'https://white-whale-ai-frontend-b2rl.vercel.app',
    /\.vercel\.app$/, // Allow all Vercel preview deployments
    
    // Your production frontend (update when you know the URL)
    // 'https://your-frontend-domain.vercel.app',
    
    // Netlify deployments
    /\.netlify\.app$/,
    
    // GitHub Pages
    /\.github\.io$/,
    
    // Custom domains (add your own here)
    // 'https://your-custom-domain.com',
    
    // Allow any domain in development
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3001', 'http://127.0.0.1:3000'] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API-only server
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for workflow execution
const workflowLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 workflow executions per minute
  message: {
    success: false,
    error: 'Too many workflow executions. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/run-workflow', workflowLimiter);
app.use(limiter);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logRequest(req, duration);
  });
  
  next();
});

// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(data) {
  return JSON.stringify(data);
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Clear old cache entries periodically
  if (cache.size > 1000) {
    const oldestKeys = Array.from(cache.keys()).slice(0, 500);
    oldestKeys.forEach(k => cache.delete(k));
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      nodeVersion: process.version,
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY
    }
  });
});

// Test endpoint to verify CORS
app.get('/test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin 
  });
});

// Pipeline parse endpoint with validation
app.post('/pipelines/parse',
  validatePipelineParse,
  handleValidationErrors,
  (req, res) => {
    try {
      const pipelineData = JSON.parse(req.body.pipeline);
      const { nodes, edges } = pipelineData;

      // Validate nodes and edges exist
      if (!nodes || !Array.isArray(nodes)) {
        throw new Error('Invalid nodes data');
      }

      // Check if it's a DAG (Directed Acyclic Graph)
      const isDAG = checkIfDAG(nodes, edges || []);

      logger.info('Pipeline parsed', {
        numNodes: nodes.length,
        numEdges: edges?.length || 0,
        isDAG
      });

      res.json({
        num_nodes: nodes.length,
        num_edges: edges?.length || 0,
        is_dag: isDAG,
        success: true
      });
    } catch (error) {
      logger.error('Pipeline parse error', { error: error.message });
      res.status(400).json({
        error: error.message,
        success: false
      });
    }
  }
);

// Main workflow execution endpoint with validation and caching
app.post('/run-workflow',
  validateWithJoi(workflowSchema),
  async (req, res) => {
  try {
    const { nodes, edges, inputs, llmConfig } = req.body;

    logger.info('Workflow execution started', {
      numNodes: nodes?.length || 0,
      numEdges: edges?.length || 0,
      inputKeys: Object.keys(inputs || {})
    });

    // Validate inputs
    if (!nodes || !Array.isArray(nodes)) {
      throw new Error('Invalid nodes data');
    }

    // Find input and output nodes
    const inputNodes = nodes.filter(node => node.type === 'customInput');
    const outputNodes = nodes.filter(node => node.type === 'customOutput');
    const llmNodes = nodes.filter(node => node.type === 'llm');

    if (inputNodes.length === 0) {
      throw new Error('No input nodes found in workflow');
    }

    if (outputNodes.length === 0) {
      throw new Error('No output nodes found in workflow');
    }

    // Build the prompt from inputs
    let systemPrompt = llmConfig?.system || 'You are a helpful assistant.';
    let userPrompt = llmConfig?.prompt || '';

    // Replace variables in system and prompt with input values
    Object.entries(inputs).forEach(([nodeId, value]) => {
      const inputNode = inputNodes.find(n => n.id === nodeId);
      if (inputNode) {
        const inputName = inputNode.data?.inputName || nodeId;
        systemPrompt = systemPrompt.replace(new RegExp(`{{${inputName}}}`, 'g'), value);
        userPrompt = userPrompt.replace(new RegExp(`{{${inputName}}}`, 'g'), value);
        
        // Also try replacing with just the value if no template variables
        if (!userPrompt.includes('{{')) {
          userPrompt = value;
        }
      }
    });

    logger.debug('Prompt prepared', {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    });

    // Get API key (from user or environment)
    const apiKey = llmConfig?.apiKey || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      logger.error('API key missing');
      throw new Error('No API key provided. Please set GOOGLE_API_KEY in .env file or provide a personal API key.');
    }

    // Check cache first (excluding API key from cache key for security)
    const cacheKey = getCacheKey({
      model: llmConfig?.model || 'gemini-2.0-flash-exp',
      system: systemPrompt,
      prompt: userPrompt
    });

    let geminiResponse = getFromCache(cacheKey);
    
    if (geminiResponse) {
      logger.info('Cache hit for workflow execution');
    } else {
      // Call Google Gemini API
      const model = llmConfig?.model || 'gemini-2.0-flash-exp';
      logger.info('Calling Gemini API', { model });
      
      geminiResponse = await callGeminiAPI({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        apiKey: apiKey
      });

      // Cache the response
      setCache(cacheKey, geminiResponse);
      logger.info('Gemini API response received', { responseLength: geminiResponse.length });
    }

    // Prepare outputs
    const outputs = {};
    outputNodes.forEach(outputNode => {
      outputs[outputNode.id] = geminiResponse;
    });

    res.json({
      success: true,
      outputs: outputs,
      metadata: {
        model: llmConfig?.model || 'gemini-2.0-flash-exp',
        tokensUsed: geminiResponse.length // Approximate
      }
    });

  } catch (error) {
    logger.error('Workflow execution error', {
      error: error.message,
      stack: error.stack
    });
    
    // Determine appropriate status code
    const statusCode = error.message.includes('API key') ? 401 :
                       error.message.includes('Validation') ? 400 :
                       error.message.includes('Gemini API') ? 502 :
                       500;
    
    res.status(statusCode).json({
      error: error.message,
      success: false
    });
  }
});

/**
 * Call Google Gemini API with retry logic
 * @param {Object} params - API call parameters
 * @param {string} params.model - Gemini model name
 * @param {string} params.system - System prompt
 * @param {string} params.prompt - User prompt
 * @param {string} params.apiKey - Google API key
 * @param {number} params.retries - Number of retries (default: 2)
 * @returns {Promise<string>} - Generated text response
 */
async function callGeminiAPI({ model, system, prompt, apiKey, retries = 2 }) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${system}\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      
      // Retry on rate limit or temporary errors
      if (retries > 0 && (response.status === 429 || response.status >= 500)) {
        logger.warn('Gemini API error, retrying', { status: response.status, retriesLeft: retries });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return callGeminiAPI({ model, system, prompt, apiKey, retries: retries - 1 });
      }
      
      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    const data = await response.json();

    // Extract the generated text
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error('No response generated from Gemini API');

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiCall('Google Gemini', model, duration, false);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    if (duration > 0) {
      logger.logApiCall('Google Gemini', model, duration, true);
    }
  }
}

/**
 * Check if the workflow graph is a Directed Acyclic Graph (DAG)
 * @param {Array} nodes - Array of workflow nodes
 * @param {Array} edges - Array of workflow edges
 * @returns {boolean} - True if graph is a DAG
 */
function checkIfDAG(nodes, edges) {
  // Build adjacency list
  const adj = {};
  nodes.forEach(node => {
    adj[node.id] = [];
  });

  edges.forEach(edge => {
    if (adj[edge.source]) {
      adj[edge.source].push(edge.target);
    }
  });

  // DFS to detect cycles
  const visited = new Set();
  const recStack = new Set();

  function hasCycle(nodeId) {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adj[nodeId] || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    recStack.delete(nodeId);
    return false;
  }

  // Check for cycles starting from each node
  for (const nodeId of Object.keys(adj)) {
    if (hasCycle(nodeId)) return false;
  }

  return true;
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    success: false
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    success: false
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    hasGoogleApiKey: !!process.env.GOOGLE_API_KEY
  });
  
  console.log(`\n🚀 WhiteWhale AI Server Running`);
  console.log(`📡 API Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/run-workflow`);
  console.log(`   - POST http://localhost:${PORT}/pipelines/parse`);
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/test`);
  console.log(`🔐 Google API Key: ${process.env.GOOGLE_API_KEY ? '✅ Configured' : '⚠️  Not configured (users must provide their own)'}`);
  console.log(`🛡️  Security: Rate limiting enabled`);
  console.log(`💾 Cache: In-memory caching enabled (${CACHE_TTL / 1000}s TTL)\n`);
});

module.exports = app;