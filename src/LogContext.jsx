// src/LogContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const LogContext = createContext();

export function useLogContext() {
  return useContext(LogContext);
}

export function LogProvider({ children }) {
  const [logs, setLogs] = useState([]);

  // window.xrayLogs değişince context'i otomatik güncelle
  useEffect(() => {
    function handleLogUpdate() {
      setLogs([...(window.xrayLogs || [])]);
    }
    window.addEventListener("xraylogupdate", handleLogUpdate);
    // ilk mount'ta da oku
    handleLogUpdate();
    return () => window.removeEventListener("xraylogupdate", handleLogUpdate);
  }, []);

  return (
    <LogContext.Provider value={{ logs, setLogs }}>
      {children}
    </LogContext.Provider>
  );
}
