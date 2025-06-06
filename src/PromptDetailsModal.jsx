// src/PromptDetailsModal.jsx
import React from "react";
import { X } from "lucide-react";
import ExpandableText from "./ExpandableText";

// --- ROL RENKLERİ ---
const roleMap = {
  system:    { bg: "#7f1d1d", color: "#fff", border: "2px solid #ef4444", icon: "⚙️", badge: "#fee2e2" },
  user:      { bg: "#6366f1", color: "#fff", border: "none", icon: "👤", badge: "#c7d2fe" },
  assistant: { bg: "#2d2d30", color: "#fff", border: "none", icon: "🤖", badge: "#f3f4f6" },
  tool:      { bg: "#223135", color: "#bae6fd", border: "none", icon: "🛠️", badge: "#bae6fd" },
};

// --- TOOL CALL/RESPONSE BİRLEŞTİR ---
function mergeToolCallsAndResponses(prompts) {
  const result = [];
  const usedToolResponses = new Set();

  for (let i = 0; i < prompts.length; i++) {
    const pr = prompts[i];

    // Asistan tool_call (function çağrısı) mı?
    if (pr.role === "assistant" && Array.isArray(pr.tool_calls) && pr.tool_calls.length > 0) {
      pr.tool_calls.forEach(tc => {
        // Sıradaki eşleşen tool cevabını bul
        const responseIdx = prompts.findIndex((p, idx) =>
          idx > i &&
          p.role === "tool" &&
          (p.tool_call_id === tc.id || p.tool_call?.id === tc.id)
        );
        if (responseIdx !== -1 && !usedToolResponses.has(responseIdx)) {
          result.push({
            mergedTool: true,
            assistantPrompt: pr,
            toolCall: tc,
            toolResponse: prompts[responseIdx],
          });
          usedToolResponses.add(responseIdx);
        } else {
          // Cevap yoksa sadece call olarak ekle
          result.push({
            mergedTool: true,
            assistantPrompt: pr,
            toolCall: tc,
            toolResponse: null,
          });
        }
      });
    }
    // Tool cevabı ise ve zaten birleştirildiyse eklemiyoruz
    else if (pr.role === "tool" && usedToolResponses.has(i)) {
      continue;
    }
    // Normal prompt
    else {
      result.push(pr);
    }
  }
  return result;
}


function ToolCallPrompt({ pr }) {
  // Tool call: hem OpenAI formatı hem custom format destekli
  const toolCall = pr.tool_call || {};
  // Argümanlar hem .arguments hem .function.arguments'dan gelebilir
  let parsedArgs =
    toolCall.function?.arguments !== undefined
      ? toolCall.function.arguments
      : toolCall.arguments;
  try {
    parsedArgs =
      typeof parsedArgs === "string" ? JSON.parse(parsedArgs) : parsedArgs;
  } catch {}

  let prettyArgs =
    parsedArgs === undefined
      ? "(YOK)"
      : typeof parsedArgs === "object"
      ? JSON.stringify(parsedArgs, null, 2)
      : String(parsedArgs);

  // Tool yanıtı
  let parsedResult = pr.tool_response?.content;
  try {
    parsedResult =
      typeof parsedResult === "string" ? JSON.parse(parsedResult) : parsedResult;
  } catch {}
  let prettyResult =
    parsedResult === undefined
      ? ""
      : typeof parsedResult === "object"
      ? JSON.stringify(parsedResult, null, 2)
      : String(parsedResult);

  return (
    <div style={{
      background: "#223135",
      color: "#bae6fd",
      borderRadius: 16,
      marginBottom: 18,
      padding: "18px 26px 22px 64px",
      fontSize: 15,
      position: "relative",
      minHeight: 64,
      boxShadow: "0 2px 16px #0ea5e933",
      borderLeft: "4px solid #36c6f1"
    }}>
      {/* Tool ikon */}
      <span style={{
        position: "absolute",
        top: 18,
        left: 20,
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#bae6fd",
        color: "#223135",
        fontWeight: 700,
        fontSize: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.92
      }}>🛠️</span>
      {/* Fonksiyon adı */}
      <span style={{
        position: "absolute",
        left: 62,
        top: 12,
        fontSize: 13,
        letterSpacing: 1,
        color: "#bae6fd",
        opacity: 0.95,
        fontWeight: 700,
        textTransform: "uppercase"
      }}>
        {toolCall.function?.name || toolCall.name || "Tool Call"}
      </span>
      {/* Argümanlar */}
      <div style={{
        background: "#15232a",
        borderRadius: 9,
        color: "#e0e7ef",
        padding: "10px 18px",
        marginTop: 16,
        marginBottom: 8,
        fontFamily: "Fira Mono, Menlo, monospace",
        fontSize: 14,
        minHeight: 34,
        boxShadow: "0 1px 6px #1e293b22"
      }}>
        <div style={{ fontWeight: 600, color: "#67e8f9", marginBottom: 4 }}>Fonksiyon Argümanları:</div>
        <ExpandableText text={prettyArgs} maxLength={180} style={{ background: "none", color: "inherit", fontSize: 14, margin: 0 }} />
      </div>
      {/* Tool cevabı */}
      {pr.tool_response && (
        <div style={{
          background: "#1e2a2e",
          borderRadius: 9,
          color: "#f9fafb",
          padding: "10px 18px",
          marginTop: 8,
          fontFamily: "Fira Mono, Menlo, monospace",
          fontSize: 15,
          minHeight: 38
        }}>
          <div style={{ fontWeight: 600, color: "#bef264", marginBottom: 4 }}>Tool Yanıtı:</div>
          <ExpandableText text={prettyResult} maxLength={220} style={{ background: "none", color: "inherit", fontSize: 15, margin: 0 }} />
        </div>
      )}
    </div>
  );
}

// --- ANA MODAL ---
export default function PromptDetailsModal({ open, onClose, prompts }) {
  if (!open) return null;
  const mergedPrompts = mergeToolCallsAndResponses(prompts);

  return (
    <div style={{
      position: "fixed", zIndex: 9999, top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(15,23,42,0.70)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#0f0f0f", borderRadius: 16, minWidth: 420, maxWidth: 720,
        maxHeight: "85vh", overflowY: "auto", boxShadow: "0 6px 42px #000c",
        position: "relative"
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10, background: "#0f0f0f",
          borderRadius: "16px 16px 0 0", minHeight: 60, display: "flex",
          alignItems: "center", justifyContent: "space-between", borderBottom: "1.3px solid #222"
        }}>
          <div style={{
            fontWeight: 700, color: "#bae6fd", fontSize: 19,
            marginLeft: 36, padding: "23px 0 19px 0"
          }}>
            Proje Promptları (Detay)
          </div>
          <button
            onClick={onClose}
            style={{
              marginRight: 22, background: "#1e293b", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 30, width: 36, height: 36, cursor: "pointer"
            }}>
            <X size={22} />
          </button>
        </div>
        {/* İçerik */}
        <div style={{ padding: "0 32px 18px 32px" }}>
          {(!prompts || prompts.length === 0) && (
            <div style={{ color: "#888", textAlign: "center", margin: 50 }}>Hiç prompt yok.</div>
          )}
          {mergedPrompts.map((item, i) => {
            // Birleştirilmiş tool çağrısı ve cevabı
            if (item.mergedTool) {
              return (
                <ToolCallPrompt
                  key={i}
                  pr={{
                    ...item.assistantPrompt,
                    tool_call: item.toolCall,
                    tool_response: item.toolResponse,
                  }}
                />
              );
            }
            // Normal prompt balonu
            const pr = item;
            const style = roleMap[pr.role] || roleMap.user;
            return (
              <div key={i}
                style={{
                  background: style.bg,
                  color: style.color,
                  border: style.border || "none",
                  borderRadius: 15,
                  marginBottom: 18,
                  padding: "19px 24px 19px 64px",
                  fontSize: 16,
                  fontWeight: pr.role === "system" ? 600 : 400,
                  position: "relative",
                  boxShadow: "0 2px 16px #1e293b12",
                  transition: "background 0.17s",
                  minHeight: 54,
                  whiteSpace: "pre-wrap"
                }}>
                {/* Sol üstte ikon + badge */}
                <span style={{
                  position: "absolute",
                  top: 18,
                  left: 20,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: style.badge,
                  color: style.bg,
                  fontWeight: 700,
                  fontSize: 21,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.92
                }}>{style.icon}</span>
                {/* Üstte küçük rol etiketi */}
                <span style={{
                  position: "absolute",
                  left: 62,
                  top: 13,
                  fontSize: 12,
                  letterSpacing: 1,
                  color: "#bae6fd",
                  opacity: 0.86,
                  fontWeight: 600,
                  textTransform: "uppercase"
                }}>
                  {pr.role}
                </span>
                {/* İçerik */}
                <ExpandableText text={pr.content} maxLength={360} style={{
                  background: "none",
                  color: "inherit",
                  margin: "11px 0 0 0",
                  fontSize: 16,
                  whiteSpace: "pre-wrap"
                }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
