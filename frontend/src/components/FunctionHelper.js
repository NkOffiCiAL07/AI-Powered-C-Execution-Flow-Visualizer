import React, { useState } from "react";
import "../styles/FunctionHelper.css";

export default function FunctionHelper({ onAddCode }) {
  const [funcName, setFuncName] = useState("myFunction");
  const [returnType, setReturnType] = useState("int");
  const [args, setArgs] = useState("int a, int b");
  const [body, setBody] = useState("return a + b;");

  const handleAddFunction = () => {
    const code = `\n${returnType} ${funcName}(${args}) {\n    ${body}\n}\n`;
    onAddCode(code);
  };

  const handleAddCall = () => {
    const callArgs = args.split(",").map(arg => {
        const parts = arg.trim().split(" ");
        return parts[parts.length - 1];
    }).join(", ");
    const code = `\nint result = ${funcName}(${callArgs});\n`;
    onAddCode(code);
  };

  return (
    <div className="function-helper-card">
      <div className="helper-header">
        <h3>🧩 Function Helper</h3>
        <span>Quickly add functions or calls</span>
      </div>
      
      <div className="helper-grid">
        <div className="helper-field">
          <label>Name</label>
          <input 
            type="text" 
            value={funcName} 
            onChange={(e) => setFuncName(e.target.value)}
          />
        </div>
        <div className="helper-field">
          <label>Return Type</label>
          <input 
            type="text" 
            value={returnType} 
            onChange={(e) => setReturnType(e.target.value)}
          />
        </div>
      </div>

      <div className="helper-field">
        <label>Arguments (comma separated)</label>
        <input 
          type="text" 
          value={args} 
          onChange={(e) => setArgs(e.target.value)}
          placeholder="int a, int b"
        />
      </div>

      <div className="helper-field">
        <label>Body</label>
        <textarea 
          value={body} 
          onChange={(e) => setBody(e.target.value)}
          placeholder="return a + b;"
        />
      </div>

      <div className="helper-actions">
        <button onClick={handleAddFunction} className="helper-btn secondary">
          Add Definition
        </button>
        <button onClick={handleAddCall} className="helper-btn primary">
          Add Call
        </button>
      </div>
    </div>
  );
}
