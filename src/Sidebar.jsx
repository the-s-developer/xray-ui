import React, { useState } from "react";
import { FileText, MessageSquare, Wrench, Settings, AlertTriangle } from "lucide-react";
import { useLogContext } from "./LogContext";
import LogDrawer from "./LogDrawer";

const sidebarStyle = {
  background: "#22273c",
  width: 56,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: 12,
  borderRight: "1.5px solid #e5e7eb"
};

const iconButtonStyle = (active) => ({
  width: 40,
  height: 40,
  margin: "6px 0",
  border: "none",
  outline: "none",
  borderRadius: 8,
  background: active ? "#2c314a" : "transparent",
  color: active ? "#6366f1" : "#c7cbe6",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s, color 0.2s"
});

const panels = [
  { key: "chat", icon: <MessageSquare size={22} />, label: "Chat" },
  { key: "project", icon: <FileText size={22} />, label: "Projects" },
  { key: "tools", icon: <Wrench size={22} />, label: "Tools" },
  { key: "settings", icon: <Settings size={22} />, label: "Settings" },
];


export function Sidebar({ selected, setSelected }) {
  const { logs } = useLogContext();
  const [showDrawer, setShowDrawer] = useState(false);

  const errorCount = logs.filter(l => l.type === "error").length;

  return (
    <div style={sidebarStyle}>
      {panels.map((panel) => (
        <button
          key={panel.key}
          style={iconButtonStyle(selected === panel.key)}
          title={panel.label}
          onClick={() => setSelected(panel.key)}
        >
          {panel.icon}
        </button>
      ))}
      {/* Log ikonu (alt kısımda) */}
      <button
        onClick={() => setShowDrawer(true)}
        style={{
          width: 40,
          height: 40,
          margin: "30px 0 8px 0",
          border: "none",
          outline: "none",
          borderRadius: 8,
          background: "transparent",
          color: errorCount > 0 ? "#f87171" : "#94a3b8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}
        title="API Logları"
      >
        <AlertTriangle size={22} />
        {errorCount > 0 && (
          <span style={{
            position: "absolute",
            top: -5,
            right: -7,
            background: "#dc2626",
            color: "#fff",
            borderRadius: "999px",
            fontSize: 12,
            fontWeight: 700,
            padding: "2px 7px",
            border: "1.2px solid #18181b",
            minWidth: 17,
            textAlign: "center"
          }}>{errorCount}</span>
        )}
      </button>
      <LogDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />
    </div>
  );
}
