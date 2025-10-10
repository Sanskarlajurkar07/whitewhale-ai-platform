// server.js - Express Backend with Google Gemini API Integration

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

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

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  next();
});

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

// Pipeline parse endpoint (existing)
app.post('/pipelines/parse', (req, res) => {
  try {
    const pipelineData = JSON.parse(req.body.pipeline);
    const { nodes, edges } = pipelineData;

    // Check if it's a DAG (Directed Acyclic Graph)
    const isDAG = checkIfDAG(nodes, edges);

    res.json({
      num_nodes: nodes.length,
      num_edges: edges.length,
      is_dag: isDAG,
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      success: false
    });
  }
});

// Main workflow execution endpoint
app.post('/run-workflow', async (req, res) => {
  try {
    const { nodes, edges, inputs, llmConfig } = req.body;

    console.log('Received workflow execution request');
    console.log('Nodes:', nodes?.length || 0);
    console.log('Input keys:', Object.keys(inputs || {}));

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

    console.log('System prompt:', systemPrompt.substring(0, 100) + '...');
    console.log('User prompt:', userPrompt.substring(0, 100) + '...');

    // Get API key (from user or environment)
    const apiKey = llmConfig?.apiKey || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('No API key provided. Please set GOOGLE_API_KEY in .env file or provide a personal API key.');
    }

    // Call Google Gemini API
    console.log('Calling Gemini API with model:', llmConfig?.model || 'gemini-2.0-flash-exp');
    const geminiResponse = await callGeminiAPI({
      model: llmConfig?.model || 'gemini-2.0-flash-exp',
      system: systemPrompt,
      prompt: userPrompt,
      apiKey: apiKey
    });

    console.log('Gemini API response received, length:', geminiResponse.length);

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
    console.error('Workflow execution error:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

// Function to call Google Gemini API
async function callGeminiAPI({ model, system, prompt, apiKey }) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
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
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Helper function to check if graph is a DAG
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
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/run-workflow`);
  console.log(`   - POST http://localhost:${PORT}/pipelines/parse`);
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - GET  http://localhost:${PORT}/test`);
  console.log(`🔐 Google API Key: ${process.env.GOOGLE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});

module.exports = app;