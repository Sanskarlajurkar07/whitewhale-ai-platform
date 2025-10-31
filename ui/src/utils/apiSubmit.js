import { useStore } from "../state/store";
import { useState } from "react";
import { toast } from "react-toastify";
import { WorkflowPopup } from "../components/WorkflowPopup";
import { FlowDiagram } from "../components/FlowDiagram";
import { ExecutionVisualizer } from "../components/ExecutionVisualizer";
import "../styles/submit-button.css";

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
      <div className="submit-button-container">
        {/* Menu Items */}
        {showMenu && (
          <>
            <button
              onClick={handleViewDiagram}
              className="submit-menu-button submit-menu-button-diagram animate-slideIn"
            >
              <svg className="submit-icon-small" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              View Flow Diagram
            </button>

            <button
              onClick={handleViewVisualizer}
              className="submit-menu-button submit-menu-button-visualizer animate-slideIn animation-delay-100"
            >
              <svg className="submit-icon-small" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
              </svg>
              Execution Visualizer
            </button>
          </>
        )}

        {/* Main Run Button */}
        <div className="submit-button-group">
          <button
            onClick={handleSubmit}
            className="submit-run-button"
            disabled={nodes.length === 0}
          >
            <svg className="submit-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Run Workflow
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="submit-toggle-button"
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
    </>
  );
};
