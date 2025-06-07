import React, { useState } from "react";
import { Eye } from "lucide-react";

export function ToolCallWithResult({ call, result }) {
 const [modalOpen, setModalOpen] = useState(false);

  // Argüman özeti
  let parsedArgs = call?.function?.arguments;
  try { parsedArgs = typeof parsedArgs === "string" ? JSON.parse(parsedArgs) : parsedArgs; } catch {}
  let argEntries = parsedArgs && typeof parsedArgs === "object" && !Array.isArray(parsedArgs)
    ? Object.entries(parsedArgs)
    : [];

  // Sonuç özeti
  let parsedResult = result?.content;
  try { parsedResult = typeof parsedResult === "string" ? JSON.parse(parsedResult) : parsedResult; } catch {}

  // Markdown özet (ilk iki key veya metin)
  const resultSummary = (
   <pre style={{
      background: "#15181f",
      color: "#cffafe",
      padding: 10,
      borderRadius: 6,
      fontSize: 11,
      whiteSpace: "pre-wrap",
      fontFamily: "Fira Mono, monospace",
      margin: 0,
      maxHeight: 300,
      overflow: "hidden",
    }}>{
      (typeof parsedResult === "object"
        ?JSON.stringify(Object.fromEntries(Object.entries(parsedResult)), null, 2)
        : parsedResult).replace(/"/g, "'").replace(/\\n/g, "\n").replace(/\\t/g, "  ")}
    </pre>
  );

  return (
    <div
      //onClick={() => setModalOpen(true)}
      style={{
        background: "#223135",
        color: "#e6f4ff",
        borderRadius: 18,
        padding: "16px 24px",
        margin: "18px 0",
        fontSize: 11,
        borderLeft: "5px solid #36c6f1",
        boxShadow: "0 1px 10px #0001",
        position: "relative",
        //cursor: "pointer",
        //userSelect: "none",
      }}
      title="Detay için tıkla"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",cursor: "pointer",fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
        <span>🪛 {call?.function?.name}</span>
        <span  
            onClick={() => setModalOpen(true)}  
            style={{ color: "#7dd3fc", fontWeight: 500, fontSize: 13, opacity: 0.8 }}>
          <Eye size={17} style={{ verticalAlign: "middle", marginRight: 2 }} />
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#bae6fd", marginBottom: 7, marginTop: 3 }}>
        {argEntries.length === 0
          ? ""
          : argEntries.slice(0, 2).map(([k, v]) =>
              <span key={k}><b>{k}</b>: {String(v).slice(0, 30)}{"  "}</span>
            )}
      </div>
      <div style={{
        background: "#1e2a2e",
        borderRadius: 10,
        color: "#f9fafb",
        padding: "10px 18px",
        fontFamily: "inherit",
        fontSize: 15,
        borderLeft: typeof parsedResult === "string" &&
                    parsedResult.includes('"error":"TOOL EXECUTION FAILED"')
          ? "4px solid #dc2626"
          : undefined
      }}>
        {resultSummary}
        {typeof parsedResult === "object" && Object.entries(parsedResult).length > 2 && <span>...</span>}
      </div>
      {/* Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(24,25,27,0.90)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#202024", borderRadius: 12, padding: 32, minWidth: 400, color: "#fff",
            position: "relative", maxWidth: 900, maxHeight: "90vh", overflow: "auto"
          }}>
            <button onClick={e => { e.stopPropagation(); setModalOpen(false); }}
              style={{
                position: "absolute", right: 20, top: 12, background: "none", border: "none",
                fontSize: 32, color: "#ccc", cursor: "pointer"
              }}>
              ×
            </button>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              <span style={{ color: "#a5b4fc" }}>{call?.function?.name}</span>
            </div>
            <pre style={{
             background: "#15181f",
              color: "#fff",
              padding: 10,
              borderRadius: 6,
              fontSize: 11,
              maxHeight: "20vh",
              overflow: "auto",
              borderRadius: 6,
              fontSize: 14,
              whiteSpace: "pre-wrap",
              fontFamily: "Fira Mono, monospace",
              marginBottom: 16
            }}>
                <pre>{(typeof parsedArgs === "object"
                  ?JSON.stringify(Object.fromEntries(Object.entries(parsedArgs)), null, 2)
                  : parsedArgs).replace(/"/g, "'").replace(/\\n/g, "\n").replace(/\\t/g, "  ")}
                </pre>
            </pre>
            <pre style={{
              background: "#223135",
              color: "#fff",
              padding: 10,
              borderRadius: 6,
              fontSize: 11,
              maxHeight: "40vh",
              overflow: "auto",
              borderRadius: 6,
              fontSize: 14,
              whiteSpace: "pre-wrap",
              fontFamily: "Fira Mono, monospace",
              marginBottom: 16
            }}>
                  {(typeof parsedResult === "object"
                    ?JSON.stringify(Object.fromEntries(Object.entries(parsedResult)), null, 2)
                    : parsedResult).replace(/"/g, "'").replace(/\\n/g, "\n").replace(/\\t/g, "  ")}

            </pre>            

          </div>
        </div>
      )}
    </div>
  );
}

