// Enhanced API call with retry logic for Render backend
// Add this helper function to WorkflowPopup.js

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

// Usage in handleRun function:
const handleRun = async () => {
  setIsRunning(true);
  setError(null);
  setSuccess(false);
  setOutputs({});

  try {
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