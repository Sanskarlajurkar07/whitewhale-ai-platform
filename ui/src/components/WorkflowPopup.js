// src/components/WorkflowPopup.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Enhanced API call with retry logic for Render backend
const callWorkflowAPI = async (workflowData, maxRetries = 3) => {
  // Use environment variable with fallback for different environments
  const baseUrl = process.env.REACT_APP_API_URL || 
                  (process.env.NODE_ENV === 'production' 
                    ? 'https://whitewhaleai-backend-1.onrender.com' 
                    : 'http://localhost:8000');
  const apiUrl = `${baseUrl}/run-workflow`;
  
  console.log('Using API base URL:', baseUrl);
  console.log('Environment:', process.env.NODE_ENV);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Calling ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 seconds
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
      
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw err;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export const WorkflowPopup = ({ isOpen, onClose, nodes, edges }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [outputs, setOutputs] = useState({});
  const [inputs, setInputs] = useState({});

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setSuccess(false);
    setOutputs({});

    try {
      const llmNodes = nodes.filter(node => node.type === 'llm');
      const workflowData = {
        nodes: nodes,
        edges: edges,
        inputs: inputs,
        llmConfig: llmNodes.length > 0 ? {
          model: llmNodes[0].data?.model || 'gemini-2.0-flash-exp',
          system: llmNodes[0].data?.system || '',
          prompt: llmNodes[0].data?.prompt || '',
          apiKey: llmNodes[0].data?.apiKey || ''
        } : null
      };

      const result = await callWorkflowAPI(workflowData);
      
      setOutputs(result.outputs || {});
      setSuccess(true);

    } catch (err) {
      console.error('Workflow execution error:', err);
      
      let errorMessage = 'Failed to run workflow';
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. The server may be starting up (this can take 30-60 seconds on Render free tier). Please try again in a moment.';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The server may be slow to respond.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", duration: 0.6 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-purple-500/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🚀</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Run Workflow</h2>
              <p className="text-white/70 text-sm mt-1">Execute your AI pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all transform hover:scale-110 hover:rotate-90"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                isRunning 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              {isRunning ? '🔄 Running...' : '▶️ Run Workflow'}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="text-red-400 font-semibold">❌ Error</div>
              <div className="text-red-300 text-sm mt-1">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <div className="text-green-400 font-semibold">✅ Success</div>
              <div className="text-green-300 text-sm mt-1">Workflow executed successfully!</div>
            </div>
          )}

          {Object.keys(outputs).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-2">📊 Outputs</div>
              <pre className="text-blue-300 text-sm whitespace-pre-wrap">
                {JSON.stringify(outputs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Export the API function for use in other components
export { callWorkflowAPI };
