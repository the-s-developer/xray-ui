// src/ToolContext.jsx
import React, { createContext, useEffect } from "react";
import { fetchWithLog } from "./utils/fetchWithLog";
import { uiTools } from "./assets/toolsRegistry";

const ToolContext = createContext();

export function ToolProvider({ children }) {
  useEffect(() => {
    // Tüm UI tool’larını backend’e register et (idempotent)
    uiTools.forEach(tool =>
      fetchWithLog("/api/ui_tools/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tool),
      }).catch(() => {})
    );
  }, []);

  return <ToolContext.Provider value={{}}>{children}</ToolContext.Provider>;
}
