// store.js - Enhanced Zustand Store with Auto-save and Undo/Redo

import {create} from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "reactflow";
import { autoSaveWorkflow, getAutoSavedWorkflow } from "../utils/workflowPersistence";
import { useEffect } from "react";

// History management for undo/redo
const MAX_HISTORY = 50;

function createHistory() {
  return {
    past: [],
    present: { nodes: [], edges: [] },
    future: []
  };
}

// Separate slice for node-related state and actions
const createNodeSlice = (set, get) => ({
  nodes: [],
  nodeIDs: {},
  history: createHistory(),
  canUndo: false,
  canRedo: false,
  getNodeID: (type) => {
    const newIDs = {...get().nodeIDs};
    newIDs[type] = (newIDs[type] || 0) + 1;
    set({nodeIDs: newIDs});
    return `${type}-${newIDs[type]}`;
  },
  addNode: (node) => {
    set((state) => {
      const newNodes = [...state.nodes, node];
      const newState = {
        nodes: newNodes,
        ...updateHistory(state, newNodes, state.edges)
      };
      
      // Auto-save after state update
      setTimeout(() => autoSaveWorkflow(newNodes, state.edges), 100);
      
      return newState;
    });
  },
  removeNode: (nodeId) => {
    set((state) => {
      const newNodes = state.nodes.filter((node) => node.id !== nodeId);
      const newEdges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      const newState = {
        nodes: newNodes,
        edges: newEdges,
        ...updateHistory(state, newNodes, newEdges)
      };
      
      setTimeout(() => autoSaveWorkflow(newNodes, newEdges), 100);
      
      return newState;
    });
  },
  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes);
      
      // Only create history entry for non-selection changes
      const shouldSaveHistory = changes.some(change => 
        change.type !== 'select' && change.type !== 'position'
      );
      
      const newState = {
        nodes: newNodes,
        ...(shouldSaveHistory ? updateHistory(state, newNodes, state.edges) : {})
      };
      
      // Debounced auto-save
      if (shouldSaveHistory) {
        setTimeout(() => autoSaveWorkflow(newNodes, state.edges), 500);
      }
      
      return newState;
    });
  },
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set((state) => {
      const newNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {...node, data: {...node.data, [fieldName]: fieldValue}}
          : node
      );
      const newState = {
        nodes: newNodes,
        ...updateHistory(state, newNodes, state.edges)
      };
      
      setTimeout(() => autoSaveWorkflow(newNodes, state.edges), 500);
      
      return newState;
    });
  },
  
  // Undo/Redo actions
  undo: () => {
    set((state) => {
      if (state.history.past.length === 0) return state;
      
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future]
        },
        canUndo: newPast.length > 0,
        canRedo: true
      };
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.history.future.length === 0) return state;
      
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      
      return {
        nodes: next.nodes,
        edges: next.edges,
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture
        },
        canUndo: true,
        canRedo: newFuture.length > 0
      };
    });
  },
  
  // Load workflow
  loadWorkflow: (nodes, edges) => {
    set((state) => {
      return {
        nodes,
        edges,
        ...updateHistory(state, nodes, edges)
      };
    });
  },
  
  // Clear workflow
  clearWorkflow: () => {
    set((state) => {
      return {
        nodes: [],
        edges: [],
        nodeIDs: {},
        ...updateHistory(state, [], [])
      };
    });
  },
});

// Separate slice for edge-related state and actions
const createEdgeSlice = (set, get) => ({
  edges: [],
  onEdgesChange: (changes) => {
    set((state) => {
      const newEdges = applyEdgeChanges(changes, state.edges);
      
      const shouldSaveHistory = changes.some(change => change.type !== 'select');
      
      const newState = {
        edges: newEdges,
        ...(shouldSaveHistory ? updateHistory(state, state.nodes, newEdges) : {})
      };
      
      if (shouldSaveHistory) {
        setTimeout(() => autoSaveWorkflow(state.nodes, newEdges), 500);
      }
      
      return newState;
    });
  },
  onConnect: (connection) => {
    set((state) => {
      const newEdges = addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.Arrow,
            height: "20px",
            width: "20px",
          },
        },
        state.edges
      );
      const newState = {
        edges: newEdges,
        ...updateHistory(state, state.nodes, newEdges)
      };
      
      setTimeout(() => autoSaveWorkflow(state.nodes, newEdges), 100);
      
      return newState;
    });
  },
});

// Debounce helper
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Debounced auto-save
const debouncedAutoSave = debounce((nodes, edges) => {
  autoSaveWorkflow(nodes, edges);
}, 1000);

// Helper function to update history
function updateHistory(state, newNodes, newEdges) {
  const newPresent = { nodes: newNodes, edges: newEdges };
  
  // Don't add to history if nothing changed
  if (JSON.stringify(state.history.present) === JSON.stringify(newPresent)) {
    return {};
  }
  
  const newPast = [...state.history.past, state.history.present].slice(-MAX_HISTORY);
  
  // Debounced auto-save
  debouncedAutoSave(newNodes, newEdges);
  
  return {
    history: {
      past: newPast,
      present: newPresent,
      future: [] // Clear future on new action
    },
    canUndo: newPast.length > 0,
    canRedo: false
  };
}

// Create the store
const useStore = create((set, get) => ({
  ...createNodeSlice(set, get),
  ...createEdgeSlice(set, get),
}));

// Initialize store with auto-saved data
const initializeStore = () => {
  if (typeof window !== 'undefined') {
    const autoSaved = getAutoSavedWorkflow();
    if (autoSaved && autoSaved.nodes && autoSaved.nodes.length > 0) {
      console.log('Restoring auto-saved workflow');
      setTimeout(() => {
        useStore.getState().loadWorkflow(autoSaved.nodes, autoSaved.edges || []);
      }, 0);
    }
  }
};

initializeStore();

// Selectors
const useNodes = () => useStore((state) => state.nodes);
const useEdges = () => useStore((state) => state.edges);
const useStoreActions = () => useStore((state) => ({
  addNode: state.addNode,
  removeNode: state.removeNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  updateNodeField: state.updateNodeField,
  getNodeID: state.getNodeID,
  undo: state.undo,
  redo: state.redo,
  loadWorkflow: state.loadWorkflow,
  clearWorkflow: state.clearWorkflow,
  canUndo: state.canUndo,
  canRedo: state.canRedo,
}));

// Hook for keyboard shortcuts
export function useKeyboardShortcuts() {
  const store = useStore();
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = store.getState();
      
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && state.canUndo) {
        e.preventDefault();
        state.undo();
      }
      
      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          (e.ctrlKey && e.key === 'y')) {
        if (state.canRedo) {
          e.preventDefault();
          state.redo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}

// Export everything at the end
export { useStore, useNodes, useEdges, useStoreActions };
