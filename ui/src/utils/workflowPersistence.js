// utils/workflowPersistence.js - Workflow Save/Load Functionality

const STORAGE_KEY = 'whitewhale_workflows';
const AUTO_SAVE_KEY = 'whitewhale_autosave';
const MAX_WORKFLOWS = 10;

/**
 * Get all saved workflows
 */
export function getSavedWorkflows() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading workflows:', error);
    return [];
  }
}

/**
 * Save a workflow
 */
export function saveWorkflow(name, nodes, edges, description = '') {
  try {
    const workflows = getSavedWorkflows();
    
    const workflow = {
      id: Date.now().toString(),
      name,
      description,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if workflow with same name exists
    const existingIndex = workflows.findIndex(w => w.name === name);
    
    if (existingIndex >= 0) {
      // Update existing
      workflows[existingIndex] = {
        ...workflow,
        id: workflows[existingIndex].id,
        createdAt: workflows[existingIndex].createdAt
      };
    } else {
      // Add new
      workflows.unshift(workflow);
      
      // Keep only MAX_WORKFLOWS
      if (workflows.length > MAX_WORKFLOWS) {
        workflows.pop();
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    return workflow;
  } catch (error) {
    console.error('Error saving workflow:', error);
    throw new Error('Failed to save workflow. Storage might be full.');
  }
}

/**
 * Load a workflow by ID
 */
export function loadWorkflow(id) {
  try {
    const workflows = getSavedWorkflows();
    return workflows.find(w => w.id === id);
  } catch (error) {
    console.error('Error loading workflow:', error);
    return null;
  }
}

/**
 * Delete a workflow
 */
export function deleteWorkflow(id) {
  try {
    const workflows = getSavedWorkflows();
    const filtered = workflows.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return false;
  }
}

/**
 * Auto-save current workflow state
 */
export function autoSaveWorkflow(nodes, edges) {
  try {
    const autoSave = {
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSave));
  } catch (error) {
    console.error('Error auto-saving workflow:', error);
  }
}

/**
 * Get auto-saved workflow
 */
export function getAutoSavedWorkflow() {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading auto-saved workflow:', error);
    return null;
  }
}

/**
 * Clear auto-save
 */
export function clearAutoSave() {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
  } catch (error) {
    console.error('Error clearing auto-save:', error);
  }
}

/**
 * Export workflow as JSON file
 */
export function exportWorkflow(name, nodes, edges) {
  const workflow = {
    name,
    nodes,
    edges,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workflow.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import workflow from JSON file
 */
export function importWorkflow(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target.result);
        
        // Validate workflow structure
        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
          throw new Error('Invalid workflow file: missing nodes');
        }
        
        if (!workflow.edges || !Array.isArray(workflow.edges)) {
          workflow.edges = [];
        }
        
        resolve(workflow);
      } catch (error) {
        reject(new Error('Invalid workflow file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
