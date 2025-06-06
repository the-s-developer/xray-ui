// src/ExpandableText.jsx
import React, { useState } from "react";

export default function ExpandableText({ text, maxLength = 10, style = {} }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  // Hem string hem obje (JSON) destekler
  let displayText = text;
  if (typeof text === "object") {
    displayText = JSON.stringify(text, null, 2);
  }

  if (displayText.length <= maxLength) {
    return <pre style={style}>{displayText}</pre>;
  }
  return (
    <div>
      <pre style={style}>
        {expanded ? displayText : displayText.slice(0, maxLength) + "…"}
      </pre>
      <button
        style={{
          background: "none",
          border: "none",
          color: "#38bdf8",
          cursor: "pointer",
          fontSize: 13,
          margin: "4px 0 0 4px",
          padding: 0,
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? "Daha az göster ▲" : "Daha fazla göster ▼"}
      </button>
    </div>
  );
}
