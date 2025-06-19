import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const CallContext = createContext();

export function CallProvider({ children }) {
  // --- State'ler
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const handlersRef = useRef({}); // tool_name => handlerFn
  const [memory, setMemory] = useState(null);
  const [toolVersion, setToolVersion] = useState({});

  const [agentStatus, setAgentStatus] = useState({state: "idle"});

  // --- WebSocket kurulum
  useEffect(() => {
    const WS_URL = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws/bridge";
    const ws = new window.WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (msg) => {
      // Tool Call (frontend tool çağrısı)
      let parsed;
      try { parsed = JSON.parse(msg.data); } catch { return; }
      // Tool call yakala
      if (parsed.event === "tool_call") {
        const toolHandler = handlersRef.current[parsed.tool];
        if (toolHandler) {
          Promise.resolve(toolHandler(parsed.args)).then(result => {
            ws.send(JSON.stringify({
              event: "tool_result",
              call_id: parsed.call_id,
              result
            }));
          });
        } else {
          ws.send(JSON.stringify({
            event: "tool_result",
            call_id: parsed.call_id,
            result: { status: "error", message: "Handler yok!" }
          }));
        }
        return; // diğer eventlere bakmadan çık
      }
      if (parsed.event === "memory_update") {
        console.log("memory update",msg)
        setMemory(parsed.data);
      } else if (parsed.event === "tools_updated") {
        setToolVersion(Date.now());
      } else if (parsed.event === "agent_status") {
        setAgentStatus(parsed.data);
      }
    };

    return () => ws.close();
  }, []);

  // --- Tool handler register
  function registerToolHandler(toolName, handlerFn) {
    handlersRef.current[toolName] = handlerFn;
    return () => { delete handlersRef.current[toolName]; };
  }

  // --- Context Value
  return (
    <CallContext.Provider value={{
      ws: wsRef.current,
      connected,
      memory,
      toolVersion,
      agentStatus,
      registerToolHandler
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  return useContext(CallContext);
}
