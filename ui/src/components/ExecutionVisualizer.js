// src/components/ExecutionVisualizer.js
// Animated Execution Dashboard - Shows real-time workflow execution with data flow

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ExecutionVisualizer = ({ isOpen, onClose, nodes, edges, executionData }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedNodes, setCompletedNodes] = useState([]);

  // Organize nodes into execution stages
  const executionStages = useMemo(() => {
    const stages = [];
    const visited = new Set();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Find input nodes (Stage 0)
    const inputNodes = nodes.filter(n => n.type === 'customInput');
    if (inputNodes.length > 0) {
      stages.push({
        name: 'Data Input',
        nodes: inputNodes,
        color: 'green',
        icon: '📥'
      });
      inputNodes.forEach(n => visited.add(n.id));
    }

    // Find nodes connected to inputs
    const getNextStage = (sourceIds) => {
      const nextNodes = [];
      edges.forEach(edge => {
        if (sourceIds.includes(edge.source) && !visited.has(edge.target)) {
          const targetNode = nodeMap.get(edge.target);
          if (targetNode && !nextNodes.find(n => n.id === targetNode.id)) {
            nextNodes.push(targetNode);
            visited.add(edge.target);
          }
        }
      });
      return nextNodes;
    };

    let currentSources = inputNodes.map(n => n.id);
    let stageNum = 1;

    while (currentSources.length > 0 && stageNum < 10) {
      const nextStageNodes = getNextStage(currentSources);
      if (nextStageNodes.length === 0) break;

      const llmNodes = nextStageNodes.filter(n => n.type === 'llm');
      const transformNodes = nextStageNodes.filter(n => ['text', 'transform', 'filter', 'merge', 'template', 'validation'].includes(n.type));
      const outputNodes = nextStageNodes.filter(n => n.type === 'customOutput');

      if (llmNodes.length > 0) {
        stages.push({
          name: 'LLM Processing',
          nodes: llmNodes,
          color: 'purple',
          icon: '🤖'
        });
      }

      if (transformNodes.length > 0) {
        stages.push({
          name: 'Data Transformation',
          nodes: transformNodes,
          color: 'blue',
          icon: '⚙️'
        });
      }

      if (outputNodes.length > 0) {
        stages.push({
          name: 'Output Generation',
          nodes: outputNodes,
          color: 'red',
          icon: '📤'
        });
      }

      currentSources = nextStageNodes.map(n => n.id);
      stageNum++;
    }

    return stages;
  }, [nodes, edges]);

  // Simulate execution flow
  useEffect(() => {
    if (isExecuting && currentStage < executionStages.length) {
      const timer = setTimeout(() => {
        const stage = executionStages[currentStage];
        setCompletedNodes(prev => [...prev, ...stage.nodes.map(n => n.id)]);
        
        setCurrentStage(prev => prev + 1);
      }, 2000);

      return () => clearTimeout(timer);
    } else if (isExecuting && currentStage >= executionStages.length) {
      setTimeout(() => {
        setIsExecuting(false);
      }, 1000);
    }
  }, [isExecuting, currentStage, executionStages]);

  const startExecution = () => {
    setIsExecuting(true);
    setCurrentStage(0);
    setCompletedNodes([]);
  };

  const resetExecution = () => {
    setIsExecuting(false);
    setCurrentStage(0);
    setCompletedNodes([]);
  };

  const StageCard = ({ stage, index, isActive, isCompleted }) => {
    const colorMap = {
      green: {
        bg: 'from-green-600 to-green-700',
        border: 'border-green-400',
        text: 'text-green-400',
        glow: 'shadow-green-500/50'
      },
      purple: {
        bg: 'from-purple-600 to-purple-700',
        border: 'border-purple-400',
        text: 'text-purple-400',
        glow: 'shadow-purple-500/50'
      },
      blue: {
        bg: 'from-blue-600 to-blue-700',
        border: 'border-blue-400',
        text: 'text-blue-400',
        glow: 'shadow-blue-500/50'
      },
      red: {
        bg: 'from-red-600 to-red-700',
        border: 'border-red-400',
        text: 'text-red-400',
        glow: 'shadow-red-500/50'
      }
    };

    const colors = colorMap[stage.color] || colorMap.blue;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: index * 0.15, type: "spring" }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: isActive ? [1, 1.05, 1] : 1,
            boxShadow: isActive 
              ? ['0 0 0px rgba(0,0,0,0)', '0 0 30px rgba(100,100,255,0.5)', '0 0 0px rgba(0,0,0,0)']
              : '0 0 0px rgba(0,0,0,0)'
          }}
          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
          className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border-2 ${
            isActive ? colors.border : 'border-white/20'
          } ${isActive ? `shadow-2xl ${colors.glow}` : 'shadow-lg'} min-w-[220px] relative overflow-hidden`}
        >
          {/* Animated background */}
          {isActive && (
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br from-white to-transparent"
              style={{ backgroundSize: '200% 200%' }}
            />
          )}

          <div className="relative z-10">
            {/* Stage Number Badge */}
            <div className="absolute -top-3 -right-3">
              <motion.div
                animate={{
                  rotate: isActive ? 360 : 0,
                  scale: isActive ? [1, 1.2, 1] : 1
                }}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg`}
              >
                {index + 1}
              </motion.div>
            </div>

            {/* Icon */}
            <motion.div
              animate={{
                rotate: isActive ? [0, 10, -10, 0] : 0,
                scale: isActive ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
              className="text-6xl mb-4 text-center"
            >
              {stage.icon}
            </motion.div>

            {/* Stage Name */}
            <h3 className="text-white font-bold text-lg text-center mb-2">
              {stage.name}
            </h3>

            {/* Node Count */}
            <div className="text-white/80 text-sm text-center">
              {stage.nodes.length} {stage.nodes.length === 1 ? 'Node' : 'Nodes'}
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex justify-center">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Completed
                </motion.div>
              ) : isActive ? (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                  />
                  Processing...
                </motion.div>
              ) : (
                <div className="bg-slate-600 text-white/60 text-xs px-3 py-1 rounded-full font-semibold">
                  Pending
                </div>
              )}
            </div>

            {/* Node Details */}
            <div className="mt-4 space-y-1">
              {stage.nodes.map((node, idx) => {
                const nodeCompleted = completedNodes.includes(node.id);
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 + idx * 0.1 }}
                    className={`text-xs px-2 py-1 rounded ${
                      nodeCompleted 
                        ? 'bg-green-500/30 text-green-200' 
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {node.data?.inputName || node.data?.outputName || node.id}
                    {nodeCompleted && ' ✓'}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Connection Arrow */}
        {index < executionStages.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.3 }}
            className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center"
          >
            <motion.div
              animate={{
                y: isCompleted ? [0, 10, 0] : 0,
                opacity: isCompleted ? [1, 0.5, 1] : 0.3
              }}
              transition={{ duration: 1.5, repeat: isCompleted ? Infinity : 0 }}
              className={`text-4xl ${isCompleted ? colors.text : 'text-white/30'}`}
            >
              ↓
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateX: 90 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotateX: -90 }}
        transition={{ type: "spring", duration: 0.7 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border-2 border-cyan-500/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="white" stroke="white" strokeWidth="2"/>
              </svg>
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-white">Execution Visualizer</h2>
              <p className="text-white/70 text-sm mt-1">Watch your workflow come to life</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all transform hover:scale-110 hover:rotate-90"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Control Panel */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 mb-8 border border-blue-400/30"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{executionStages.length}</div>
                  <div className="text-white/60 text-sm">Stages</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{currentStage}</div>
                  <div className="text-white/60 text-sm">Current</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{completedNodes.length}</div>
                  <div className="text-white/60 text-sm">Completed</div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startExecution}
                  disabled={isExecuting}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  {isExecuting ? 'Running...' : 'Start Execution'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetExecution}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Reset
                </motion.button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm font-medium">Overall Progress</span>
                <span className="text-white/70 text-sm font-medium">
                  {executionStages.length > 0 ? Math.round((currentStage / executionStages.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: executionStages.length > 0 ? `${(currentStage / executionStages.length) * 100}%` : '0%'
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Execution Stages */}
          <div className="space-y-20">
            {executionStages.map((stage, index) => (
              <StageCard
                key={index}
                stage={stage}
                index={index}
                isActive={currentStage === index && isExecuting}
                isCompleted={currentStage > index}
              />
            ))}
          </div>

          {/* Completion Message */}
          <AnimatePresence>
            {isExecuting && currentStage >= executionStages.length && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mt-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 1 }}
                  className="text-8xl mb-4"
                >
                  ✅
                </motion.div>
                <h3 className="text-3xl font-bold text-green-400 mb-2">Workflow Completed!</h3>
                <p className="text-white/70 text-lg">All stages have been executed successfully</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
