import React from "react";
import { useEffect, useState, useRef } from "react";

export function MemoryViewer() {
  const [memory, setMemory] = useState(null);
  const wsRef = useRef();

  useEffect(() => {
    const ws = new window.WebSocket("ws://localhost:8000/ws/memory");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      setMemory(JSON.parse(event.data));
    };
    ws.onopen = () => {
      ws.send("memory_request");
    };
    ws.onerror = (e) => console.error(e);
    ws.onclose = () => console.log("WebSocket closed");

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h4>Context Memory (Realtime)</h4>
      <pre style={{
        background: '#f3f4f6',
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        minHeight: 220
      }}>
        {memory ? JSON.stringify(memory, null, 2) : "Bağlanıyor..."}
      </pre>
    </div>
  );
}
