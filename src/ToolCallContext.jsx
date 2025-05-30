// src/ToolCallContext.jsx
import React, { createContext, useContext, useEffect, useRef } from "react";
import { useBridgeWebSocket } from "./BridgeWebSocketContext";

const ToolCallContext = createContext();

export function ToolCallProvider({ children }) {
  const { ws,connected } = useBridgeWebSocket();
  const handlersRef = useRef({}); // tool_name => handlerFn

  function registerToolHandler(toolName, handlerFn) {
    handlersRef.current[toolName] = handlerFn;
    return () => { delete handlersRef.current[toolName]; };
  }

  useEffect(() => {
    if (!ws) return;
    function handleWSMessage(event) {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.event === "tool_call") {
        const toolHandler = handlersRef.current[msg.tool];
        if (toolHandler) {
          Promise.resolve(toolHandler(msg.args)).then(result => {
            ws.send(JSON.stringify({
              event: "tool_result",
              call_id: msg.call_id,
              result
            }));
          });
        } else {
          ws.send(JSON.stringify({
            event: "tool_result",
            call_id: msg.call_id,
            result: { status: "error", message: "Handler yok!" }
          }));
        }
      }
    }
    ws.addEventListener("message", handleWSMessage);
    return () => ws.removeEventListener("message", handleWSMessage);
  }, [ws]);

  return (
    <ToolCallContext.Provider value={{ registerToolHandler, connected }}>
      {children}
    </ToolCallContext.Provider>
  );
}

export function useToolCall() {
  return useContext(ToolCallContext);
}
