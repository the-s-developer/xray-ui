import React, { useEffect, useState, useRef } from "react";

export function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      gap: 10,
      userSelect: "none",
      fontWeight: 600,
      color: "#facc15"
    }}>
      <span>{label}</span>
      <span style={{ position: "relative", width: 38, height: 20, display: "inline-block" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{
            opacity: 0,
            width: 0,
            height: 0,
            position: "absolute",
          }}
        />
        <span style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: checked ? "#6366f1" : "#232333",
          borderRadius: 12,
          transition: "background 0.2s"
        }} />
        <span style={{
          position: "absolute",
          left: checked ? 18 : 2,
          top: 2,
          width: 16,
          height: 16,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 4px #0003",
          transition: "left 0.2s",
        }} />
      </span>
    </label>
  );
}
