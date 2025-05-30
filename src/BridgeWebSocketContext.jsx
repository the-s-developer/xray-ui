// src/BridgeWebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const BridgeWSContext = createContext();

export function BridgeWebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const [eventData, setEventData] = useState({}); // {memory, tools, ...}

  useEffect(() => {
    // WS URL ayarla
    const WS_URL =
      (window.location.protocol === "https:" ? "wss://" : "ws://") +
      window.location.host +
      "/ws/bridge";
    const ws = new window.WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        // Her event ayrı key ile tutulabilir, senin ihtiyacına göre şekillendir.
        if (parsed.event === "memory_update") {
          setEventData(e => ({ ...e, memory: parsed.data }));
        } else if (parsed.event === "tools_updated") {
          setEventData(e => ({ ...e, toolsVersion: (e.toolsVersion || 0) + 1 }));
        } else if (parsed.event === "tool_result") {
          // tool result özel işleme girsin istersen
          setEventData(e => ({ ...e, lastToolResult: parsed }));
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <BridgeWSContext.Provider value={{ ws: wsRef.current, connected, eventData }}>
      {children}
    </BridgeWSContext.Provider>
  );
}

export function useBridgeWebSocket() {
  return useContext(BridgeWSContext);
}
