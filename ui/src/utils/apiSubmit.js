// src/utils/apiSubmit.js
// Replace your existing SubmitButton with this updated version

import { useStore } from "../state/store";
import { useState } from "react";
import { toast } from "react-toastify";
import { WorkflowPopup } from "../components/WorkflowPopup";
import { FlowDiagram } from "../components/FlowDiagram";
import { ExecutionVisualizer } from "../components/ExecutionVisualizer";

export const SubmitButton = () => {
  const { nodes, edges } = useStore();
  const [showPopup, setShowPopup] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSubmit = () => {
    if (nodes.length === 0) {
      toast.warning("Please add some nodes to your pipeline first!");
      return;
    }

    // Check if there are input nodes
    const inputNodes = nodes.filter(node => node.type === 'customInput');
    if (inputNodes.length === 0) {
      toast.warning("Please add at least one Input node to your workflow!");
      return;
    }

    // Check if there are output nodes
    const outputNodes = nodes.filter(node => node.type === 'customOutput');
    if (outputNodes.length === 0) {
      toast.warning("Please add at least one Output node to your workflow!");
      return;
    }

    // Check if there are LLM nodes
    const llmNodes = nodes.filter(node => node.type === 'llm');
    if (llmNodes.length === 0) {
      toast.warning("Please add at least one LLM node to your workflow!");
      return;
    }

    // Open the workflow execution popup
    setShowPopup(true);
    toast.info("🚀 Ready to execute your workflow!");
  };

  const handleViewDiagram = () => {
    if (nodes.length === 0) {
      toast.warning("Please add some nodes to your pipeline first!");
      return;
    }
    setShowDiagram(true);
    setShowMenu(false);
  };

  const handleViewVisualizer = () => {
    if (nodes.length === 0) {
      toast.warning("Please add some nodes to your pipeline first!");
      return;
    }
    setShowVisualizer(true);
    setShowMenu(false);
  };

  return (
    <>
      {/* Main Action Buttons */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
        {/* Menu Items */}
        {showMenu && (
          <>
            <button
              onClick={handleViewDiagram}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 8px 16px rgba(102, 126, 234, 0.4)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "slideIn 0.3s ease-out"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateX(-4px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateX(0)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              View Flow Diagram
            </button>

            <button
              onClick={handleViewVisualizer}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 8px 16px rgba(17, 153, 142, 0.4)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "slideIn 0.3s ease-out 0.1s backwards"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateX(-4px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateX(0)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
              </svg>
              Execution Visualizer
            </button>
          </>
        )}

        {/* Main Run Button */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 8px 16px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 12px 24px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 16px rgba(102, 126, 234, 0.4)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Run Workflow
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 8px 16px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 12px 24px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 16px rgba(102, 126, 234, 0.4)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ transform: showMenu ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s ease" }}>
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </div>
      </div>

      <WorkflowPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        nodes={nodes}
        edges={edges}
      />

      <FlowDiagram
        isOpen={showDiagram}
        onClose={() => setShowDiagram(false)}
        nodes={nodes}
        edges={edges}
      />

      <ExecutionVisualizer
        isOpen={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        nodes={nodes}
        edges={edges}
      />

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};
