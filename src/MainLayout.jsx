import React, { useState, useRef } from "react";
import { Sidebar } from "./Sidebar";
import ChatPanel from "./ChatPanel";
import { ToolsPanel } from "./ToolPanel";
import { SettingsPanel } from "./SettingsPanel";
import ScriptPanel from "./ScriptPanel";
import { useCallContext } from "./CallContext"; // <-- güncel context
import ProjectPanel from "./ProjectPanel";
import { Toaster } from "react-hot-toast";

export default function MainLayout() {
  const [selected, setSelected] = useState("chat");
  const [leftWidth, setLeftWidth] = useState(1024);
  const dragging = useRef(false);
  const { eventData, agentStatus } = useCallContext();
  const memory = eventData.memory || null;
  const toolsVersion = eventData.toolsVersion || 0;

  function onMouseMove(e) {
    if (!dragging.current) return;
    setLeftWidth(Math.max(240, Math.min(e.clientX, window.innerWidth * 0.7)));
  }
  function onMouseUp() {
    dragging.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }
  function onMouseDown() {
    dragging.current = true;
    document.body.style.cursor = "ew-resize";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
  function renderAllPanels() {
    return (
      <>
        <div style={{ display: selected === "project" ? "block" : "none", height: "100%", width: "100%" }}>
          <ProjectPanel />
        </div>
        <div style={{ display: selected === "chat" ? "block" : "none", height: "100%", width: "100%" }}>
          <ChatPanel memory={memory} agentStatus={agentStatus} />
        </div>
        <div style={{ display: selected === "tools" ? "block" : "none", height: "100%", width: "100%" }}>
          <ToolsPanel toolsVersion={toolsVersion} />
        </div>
        <div style={{ display: selected === "settings" ? "block" : "none", height: "100%", width: "100%" }}>
          <SettingsPanel />
        </div>
      </>
    );
  }
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      background: "#0f0f0f",
      overflow: "hidden",
    }}>
      <div style={{ width: 60, flexShrink: 0, height: "100vh", zIndex: 2 }}>
        <Sidebar selected={selected} setSelected={setSelected} />
      </div>
      <div style={{
        width: leftWidth,
        minWidth: 240,
        maxWidth: "70vw",
        transition: dragging.current ? "none" : "width 0.13s",
        background: "#18181b",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        overflowY: "auto",
      }}>
        {renderAllPanels()}
      </div>
      <div
        style={{
          width: 8,
          cursor: "ew-resize",
          background: "linear-gradient(90deg,#262a3a 0%, #373d59 100%)",
          zIndex: 10,
          userSelect: "none",
          height: "100vh",
        }}
        onMouseDown={onMouseDown}
      />
      <div style={{
        flex: 1,
        minWidth: 0,
        height: "100vh",
        background: "#fff",
        overflow: "auto",
      }}>
        <ScriptPanel />
      </div>
      <Toaster position="top-center" toastOptions={{ duration: 1600 }} />
    </div>
  );
}
