// src/LogDrawer.jsx
import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useLogContext } from "./LogContext";

const MAX_PREVIEW = 400; // Kaç karakterden uzun ise kısalt, tam göster butonu koy

export default function LogDrawer({ open, onClose }) {
  const { logs, setLogs } = useLogContext();
  const [expanded, setExpanded] = useState({}); // { [id]: bool }

  if (!open) return null;

  const handleToggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000000,
        background: "rgba(24,25,27,0.40)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 380,
          height: "100%",
          background: "#18181b",
          boxShadow: "3px 0 18px #000a",
          borderRight: "1.5px solid #27272a",
          display: "flex",
          flexDirection: "column",
          animation: "slideInLeft 0.22s cubic-bezier(.39,.58,.57,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px 10px 20px",
            borderBottom: "1.5px solid #232333",
          }}
        >
          <span
            style={{
              color: "#f87171",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 1,
            }}
          >
            API Logları
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Temizle (Clear) Butonu */}
            <button
              onClick={() => setLogs([])}
              style={{
                background: "none",
                border: "none",
                color: "#f87171",
                borderRadius: 7,
                fontSize: 20,
                width: 32,
                height: 32,
                cursor: "pointer",
                marginRight: 2,
              }}
              title="Tüm logları temizle"
            >
              <Trash2 size={18} />
            </button>
            {/* Kapat Butonu */}
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                borderRadius: 7,
                fontSize: 24,
                width: 34,
                height: 34,
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 14px 18px 18px",
          }}
        >
          {logs.length === 0 && (
            <div style={{ color: "#a3a3a3", fontWeight: 400, marginTop: 30 }}>
              Şu anda kayıtlı bir API hatası yok.
            </div>
          )}
          {logs.map((log) => {
            const isExpanded = !!expanded[log.id];
            const detail = log.detail ?? "";
            const isLong = detail.length > MAX_PREVIEW;
            return (
              <div
                key={log.id}
                style={{
                  background: log.type === "error" ? "#991b1b" : "#3b82f6",
                  borderRadius: 9,
                  padding: "11px 15px",
                  marginBottom: 15,
                  fontSize: 15,
                  border:
                    log.type === "error"
                      ? "1.2px solid #ef4444"
                      : "1.2px solid #38bdf8",
                  color: "#fff",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  {log.type === "error" ? "HATA: " : ""}
                  {log.message}
                </div>
                <div style={{ fontSize: 13, opacity: 0.89, marginBottom: 3 }}>
                  {isLong && !isExpanded
                    ? (
                        <>
                          <pre
                            style={{
                              display: "inline",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              maxHeight: 110,
                              overflow: "hidden",
                            }}
                          >
                            {detail.slice(0, MAX_PREVIEW) + "..."}
                          </pre>
                          <button
                            style={{
                              marginLeft: 6,
                              background: "#232333",
                              color: "#facc15",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              padding: "2px 9px",
                              cursor: "pointer",
                            }}
                            onClick={() => handleToggle(log.id)}
                          >
                            Detayı Göster
                          </button>
                        </>
                      )
                    : (
                        <>
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              maxHeight: 300,
                              overflowY: "auto",
                            }}
                          >
                            {detail}
                          </pre>
                          {isLong && (
                            <button
                              style={{
                                marginTop: 5,
                                background: "#232333",
                                color: "#facc15",
                                border: "none",
                                borderRadius: 6,
                                fontSize: 12,
                                padding: "2px 9px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleToggle(log.id)}
                            >
                              Detayı Gizle
                            </button>
                          )}
                        </>
                      )}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {log.timestamp}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
