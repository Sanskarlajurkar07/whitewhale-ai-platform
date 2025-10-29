// llmNode.js

import {BaseNode} from "./BaseNode";
import {useState} from "react";

export const LLMNode = ({id, data}) => {
  const [system, setSystem] = useState(data?.system || "");
  const [prompt, setPrompt] = useState(data?.prompt || "");
  const [model, setModel] = useState(data?.model || "gemini-2.0-flash-exp");
  const [usePersonalKey, setUsePersonalKey] = useState(data?.usePersonalKey || false);
  const [apiKey, setApiKey] = useState(data?.apiKey || "");

  return (
    <BaseNode
      id={id}
      title={
        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4285F4"/>
            <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#34A853"/>
            <path d="M2 12L12 17L22 12V7L12 12L2 7V12Z" fill="#FBBC04"/>
            <path d="M12 12L22 7V12L12 17V12Z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </div>
      }
      inputs={[{id: "system"}, {id: "prompt"}]}
      outputs={[{id: "response"}]}
      type="llm"
      data={data}
    >
      <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
        {/* System Instructions */}
        <div>
          <label style={{display: "block", marginBottom: "4px", fontSize: "13px", color: "#ecf0f1", fontWeight: "500"}}>
            System (Instructions)
          </label>
          <textarea
            className="node-input"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="Enter system instructions..."
            style={{minHeight: "60px", resize: "vertical"}}
          />
        </div>

        {/* Prompt */}
        <div>
          <label style={{display: "block", marginBottom: "4px", fontSize: "13px", color: "#ecf0f1", fontWeight: "500"}}>
            Prompt
          </label>
          <textarea
            className="node-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            style={{minHeight: "60px", resize: "vertical"}}
          />
        </div>

        {/* Model Selector */}
        <div>
          <label style={{display: "block", marginBottom: "4px", fontSize: "13px", color: "#ecf0f1", fontWeight: "500"}}>
            Model
          </label>
          <select
            className="node-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
            <option value="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking-exp</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
          </select>
        </div>

        {/* Use Personal API Key Toggle */}
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0"}}>
          <label style={{fontSize: "13px", color: "#ecf0f1", fontWeight: "500"}}>
            Use Personal API Key
          </label>
          <label style={{position: "relative", display: "inline-block", width: "50px", height: "24px"}}>
            <input
              type="checkbox"
              checked={usePersonalKey}
              onChange={(e) => setUsePersonalKey(e.target.checked)}
              style={{opacity: 0, width: 0, height: 0}}
            />
            <span style={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: usePersonalKey ? "#4CAF50" : "rgba(255, 255, 255, 0.2)",
              transition: "0.4s",
              borderRadius: "24px"
            }}>
              <span style={{
                position: "absolute",
                content: "",
                height: "18px",
                width: "18px",
                left: usePersonalKey ? "28px" : "3px",
                bottom: "3px",
                backgroundColor: "white",
                transition: "0.4s",
                borderRadius: "50%"
              }}></span>
            </span>
          </label>
        </div>

        {/* API Key Input (shown when toggle is on) */}
        {usePersonalKey && (
          <div>
            <label style={{display: "block", marginBottom: "4px", fontSize: "13px", color: "#ecf0f1", fontWeight: "500"}}>
              API Key
            </label>
            <input
              className="node-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
            />
            <div style={{fontSize: "11px", color: "#e74c3c", marginTop: "4px", fontStyle: "italic"}}>
              ⚠️ Do not share API Key with anyone you do not trust!
            </div>
          </div>
        )}

        {/* Internal ID Display */}
        <div style={{fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px", fontFamily: "monospace"}}>
          ID: google_0
        </div>
      </div>
    </BaseNode>
  );
};
