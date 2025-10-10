// src/components/FlowDiagram.js
// Visual Flow Diagram Component - Shows simplified pipeline structure

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const FlowDiagram = ({ nodes, edges, isOpen, onClose }) => {
  // Organize nodes by type
  const organizedNodes = useMemo(() => {
    const inputs = nodes.filter(n => n.type === 'customInput');
    const llms = nodes.filter(n => n.type === 'llm');
    const transforms = nodes.filter(n => ['text', 'transform', 'filter', 'merge', 'template', 'validation'].includes(n.type));
    const outputs = nodes.filter(n => n.type === 'customOutput');
    
    return { inputs, llms, transforms, outputs };
  }, [nodes]);

  // Calculate connections
  const connections = useMemo(() => {
    const conn = {
      inputToLlm: 0,
      inputToTransform: 0,
      llmToTransform: 0,
      llmToOutput: 0,
      transformToLlm: 0,
      transformToOutput: 0,
    };

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      if (sourceType === 'customInput' && targetType === 'llm') conn.inputToLlm++;
      if (sourceType === 'customInput' && ['text', 'transform', 'filter', 'merge', 'template', 'validation'].includes(targetType)) conn.inputToTransform++;
      if (sourceType === 'llm' && ['text', 'transform', 'filter', 'merge', 'template', 'validation'].includes(targetType)) conn.llmToTransform++;
      if (sourceType === 'llm' && targetType === 'customOutput') conn.llmToOutput++;
      if (['text', 'transform', 'filter', 'merge', 'template', 'validation'].includes(sourceType) && targetType === 'llm') conn.transformToLlm++;
      if (['text', 'transform', 'filter', 'merge', 'template', 'validation'].includes(sourceType) && targetType === 'customOutput') conn.transformToOutput++;
    });

    return conn;
  }, [nodes, edges]);

  const NodeBox = ({ type, count, color, icon, label }) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="relative"
    >
      <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-2xl border-2 border-white/20 min-w-[180px]`}>
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">{icon}</div>
          <div className="text-center">
            <div className="text-white font-bold text-lg">{label}</div>
            <div className="text-white/80 text-sm mt-1">
              {count} {count === 1 ? 'Node' : 'Nodes'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ConnectionLine = ({ count, delay }) => (
    count > 0 && (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 1 }}
        transition={{ duration: 0.8, delay }}
        className="relative h-1 bg-gradient-to-r from-blue-400 to-purple-400"
      >
        <motion.div
          animate={{ 
            x: [0, 80, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-0 w-3 h-3 bg-white rounded-full -translate-y-1/2 shadow-lg"
        />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          {count}
        </div>
      </motion.div>
    )
  );

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
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border-2 border-purple-500/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.8"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-white">Workflow Diagram</h2>
              <p className="text-white/70 text-sm mt-1">Visual representation of your pipeline</p>
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
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Stats Bar */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-8 border border-blue-400/30"
          >
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-3xl font-bold text-blue-400">{nodes.length}</div>
                <div className="text-white/60 text-sm">Total Nodes</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <div className="text-3xl font-bold text-purple-400">{edges.length}</div>
                <div className="text-white/60 text-sm">Connections</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <div className="text-3xl font-bold text-pink-400">
                  {organizedNodes.inputs.length + organizedNodes.llms.length + organizedNodes.transforms.length + organizedNodes.outputs.length}
                </div>
                <div className="text-white/60 text-sm">Active Components</div>
              </div>
            </div>
          </motion.div>

          {/* Flow Diagram */}
          <div className="space-y-12">
            {/* Stage 1: Inputs */}
            {organizedNodes.inputs.length > 0 && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center mb-4">
                  <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-400/30">
                    Stage 1: Data Input
                  </span>
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  <NodeBox
                    type="input"
                    count={organizedNodes.inputs.length}
                    color="from-green-600 to-green-700"
                    icon="📥"
                    label="Input Nodes"
                  />
                </div>
              </motion.div>
            )}

            {/* Connection Lines */}
            {(connections.inputToLlm > 0 || connections.inputToTransform > 0) && (
              <div className="flex justify-center">
                <div className="w-64">
                  <ConnectionLine count={connections.inputToLlm + connections.inputToTransform} delay={0.5} />
                </div>
              </div>
            )}

            {/* Stage 2: Processing Layer */}
            {(organizedNodes.llms.length > 0 || organizedNodes.transforms.length > 0) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-center mb-4">
                  <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-semibold border border-purple-400/30">
                    Stage 2: Processing Layer
                  </span>
                </div>
                <div className="flex justify-center gap-8 flex-wrap">
                  {organizedNodes.llms.length > 0 && (
                    <NodeBox
                      type="llm"
                      count={organizedNodes.llms.length}
                      color="from-purple-600 to-purple-700"
                      icon="🤖"
                      label="LLM Nodes"
                    />
                  )}
                  {organizedNodes.transforms.length > 0 && (
                    <NodeBox
                      type="transform"
                      count={organizedNodes.transforms.length}
                      color="from-blue-600 to-blue-700"
                      icon="⚙️"
                      label="Transform Nodes"
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Connection Lines */}
            {(connections.llmToOutput > 0 || connections.transformToOutput > 0) && (
              <div className="flex justify-center">
                <div className="w-64">
                  <ConnectionLine count={connections.llmToOutput + connections.transformToOutput} delay={0.8} />
                </div>
              </div>
            )}

            {/* Stage 3: Outputs */}
            {organizedNodes.outputs.length > 0 && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="text-center mb-4">
                  <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold border border-red-400/30">
                    Stage 3: Output Results
                  </span>
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  <NodeBox
                    type="output"
                    count={organizedNodes.outputs.length}
                    color="from-red-600 to-red-700"
                    icon="📤"
                    label="Output Nodes"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Legend */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 bg-slate-800/50 rounded-xl p-6 border border-slate-700"
          >
            <h3 className="text-white font-semibold mb-4 text-lg">📊 Pipeline Flow</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Data enters through Input nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>LLM/Transform nodes process data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Results exported via Output nodes</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
