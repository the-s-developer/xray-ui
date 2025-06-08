// src/ChatPanel.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLogContext } from "./LogContext";
import { Play, Send, Edit2, Eye, Plus, RotateCw, Trash2, Copy, Bot, Terminal,Square,StopCircle , Scissors,Eraser} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import MarkdownMessage from "./MarkdownMessage";
import FullScreenCodeEditor from "./FullScreenCodeEditor";
import { ToolCallWithResult } from "./ToolCallMessage";
import { useSettings } from "./SettingsContext";
import { fetchWithLog } from "./utils/fetchWithLog";
import { useCallContext } from "./CallContext";
import toast from "react-hot-toast";

const AgentState = {
  IDLE: "idle",
  GENERATING: "generating",
  TOOL_CALLING: "tool_calling",
  DONE: "done",
  STOPPED: "stopped",
  ERROR: "error",
};

// Status için UI mapping (ikon, renk, açıklama)
const statusMap = {
  [AgentState.IDLE]:     { icon: "⚪", color: "#ffe066", text: "Beklemede" },
  [AgentState.GENERATING]: { icon: "🟡", color: "#fbbf24", text: "Yanıt üretiliyor" },
  [AgentState.TOOL_CALLING]: { icon: "🔧", color: "#0ea5e9", text: "Araç çalışıyor" },
  [AgentState.DONE]:     { icon: "🟢", color: "#22c55e", text: "Bitti" },
  [AgentState.ERROR]:  { icon: "🔴", color: "#f87171", text: "Hata oluştu" },
  [AgentState.STOPPED]: { icon: "🟠", color: "#f97316", text: "Durduruldu" },
};

function getStatusUI(state, tps) {
  const s = statusMap[state] || statusMap[AgentState.IDLE];
  return (
    <>
      <span style={{ fontSize: 18 }}>{s.icon}</span>
      <span style={{ fontSize: 13, color: "white", fontWeight: 600 }}>
        {typeof tps === "number" && !isNaN(tps) ? `${tps.toFixed(2)} t/s` : ""}
      </span>
    </>
  );
}



const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  padding: "7px 12px 6px 12px",
  background: "#18181b",
  borderRadius: 12,
  margin: "12px 10px 0 10px",
  minHeight: 40,
  justifyContent: "space-between"
};

const selectStyle = {
  background: "#18181b",
  color: "#facc15",
  fontWeight: 700,
  border: "1.5px solid #232333",
  borderRadius: 7,
  fontSize: 16,
  padding: "3px 11px",
  outline: "none",
  height: 28,
  minWidth: 120,
  letterSpacing: 1,
  boxShadow: "none",
  marginRight: 2,
};

const toolbarBtn = {
  background: "#232333",
  color: "#ffc700",
  border: "none",
  borderRadius: "50%",
  width: 28,
  height: 28,
  minWidth: 28,
  minHeight: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 18,
  marginLeft: 9,
  transition: "background 0.18s"
};
const toolbarBtnRed = {
  ...toolbarBtn, background: "#b91c1c", color: "#fff",
};

const styles = {
  panel: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    backgroundColor: "#0f0f0f",
    color: "#f5f5f5",
    position: "relative",
  },
  chatContainer: { 
    flex: 1,
    overflowY: "auto", 
    background: "#1e1e1f", 
    borderRadius: 14, 
    padding: "24px 16px 16px 16px", 
    margin: "0 16px", 
    display: "flex", 
    flexDirection: "column",
    position: "relative", 
  },
  systemBubble: { 
    background: "#7f1d1d", 
    color: "#fff", 
    border: "2px solid #ef4444", 
    borderRadius: 13, 
    marginBottom: 12, 
    padding: "30px 30px 30px 30px", 
    fontWeight: 600, 
    position: "relative" 
  },
  userBubble: { 
    background: "#6366f1", 
    color: "#fff", 
    borderRadius: "14px 14px 2px 14px", 
    padding: "30px 30px 30px 30px", 
    marginBottom: 8, 
    fontWeight: 500, 
    wordBreak:"break-word", width: "100%", 
    boxSizing: "border-box", 
    position: "relative" 
  },
  botBubble: { 
    background: "#2d2d30", 
    color: "#f5f5f5", 
    borderRadius: "14px 14px 14px 2px", 
    padding: "40px 40px 40px 40px", 
    marginBottom: 8, 
    fontWeight: 400, 
    wordBreak: "break-word", 
    width: "100%", 
    boxSizing: "border-box", 
    position: "relative" 
  },
  
  inputWrapper: { 
    position: "sticky", 
    bottom: 0, 
    backgroundColor: "#0f0f0f", 
    padding: "8px 16px 16px 16px", 
    zIndex: 0
  },
  form: { display: "flex", gap: 10, alignItems: "flex-end", margin: 0 },
  textarea: { flex: 1, resize: "none", borderRadius: 12, border: "1px solid #4b5563", padding: "12px 14px", outline: "none", background: "#1e1e1f", color: "#f5f5f5", lineHeight: 1.5, fontFamily: "inherit" },
  sendButton: { background: "#6366f1", border: "none", borderRadius: 7, color: "#fff", padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", fontWeight: 600, gap: 6, height: 48 },
  insertBtn: { background: "#14b8a6", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, cursor: "pointer", marginLeft: 5, boxShadow: "0 2px 6px #0001" },
  smallBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    opacity: 0.7,
    cursor: "pointer",
    marginRight: 2,
    padding: 2
  },
};
const iconOverlayStyle = {
  position: "absolute",
  top: 8,
  right: 12,
  display: "flex",
  flexDirection: "row",
  gap: 2,
  zIndex: 2,
  background: "rgba(24,24,27,0.70)",
  borderRadius: 7,
  boxShadow: "0 2px 8px #0002",
  padding: "2px 4px",
  alignItems: "center"
};
const iconButtonStyle = {
  background: "none",
  border: "none",
  color: "#fff",
  opacity: 0.85,
  width: 24,
  height: 24,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 5,
  margin: 0,
  padding: 0,
  transition: "background 0.12s, opacity 0.12s"
};

const bubbleIconOverlayStyle = {
  position: "absolute",
  top: 8,
  left: 3,
  background: "rgba(24,24,27,0.70)",
  borderRadius: "50%",
  boxShadow: "0 2px 8px #0002",
  padding: 1,
  zIndex: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};



function getFlattenedChat(memory, showTools = true) {
  if (!memory?.messages) return [];

  const result = [];
  const pendingCalls = new Map();          // call_id  ->  tool_call meta

  for (const msg of memory.messages) {
    // USER/SYSTEM
    if (msg.role === "user" || msg.role === "system") {
      if (msg.content != null) result.push({ type: "chat", ...msg });
      continue;
    }

    // ASSISTANT
    if (msg.role === "assistant") {
      if (msg.content != null) result.push({ type: "chat", ...msg });
      if (showTools && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          pendingCalls.set(tc.id, { ...tc, parentRole: msg.role, id: msg["meta"]["id"] });
        }
      }
      continue;
    }

    // TOOL (result)
    if (showTools && msg.role === "tool") {
      const callMeta = pendingCalls.get(msg.tool_call_id);
      if (callMeta) {
        // Eşleşti → birlikte göster
        result.push({ type: "tool_combo", call: callMeta, result: msg });
        pendingCalls.delete(msg.tool_call_id);
      } else {
        // Eşleşemedi → bağımsız göster
        result.push({ type: "tool_result", ...msg });
      }
      continue;
    }
  }
  // Kalan yetim tool-calls'ı ister göster ister gösterme
  // pendingCalls.forEach(call => result.push({ type:"tool_call_orphan", call }));

  return result;
}



export default function ChatPanel({ memory }) {


  const { settings, updateSettings } = useSettings();
  const { showImagePreview, showCodeLineNumbers, codeWrap, enterToSend, bubbleFontScale } = settings;
  const { agentStatus } = useCallContext();

   const [modelOptions, setModelOptions] = useState([]);
  const [defaultModel, setDefaultModel] = useState("");


  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullScreenEditorOpen, setFullScreenEditorOpen] = useState(false);
  const [editorInitialValue, setEditorInitialValue] = useState("");
  const [editorBubbleId, setEditorBubbleId] = useState(null);
  const [assistantEditorOpen, setAssistantEditorOpen] = useState(false);
  const [assistantEditorInitialValue, setAssistantEditorInitialValue] = useState("");
  const [insertAfterId, setInsertAfterId] = useState(null);
  const [insertModalOpen, setInsertModalOpen] = useState(false);


  const chatEndRef = useRef();
  const flattenedChat = getFlattenedChat(memory, true);
const inputRef = useRef();

  // Streaming
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
const [lastTps, setLastTps] = useState(0);
const jobActive = streaming ||
  [AgentState.GENERATING, AgentState.TOOL_CALLING].includes(agentStatus.state);

  useEffect(() => {
    if (defaultModel) localStorage.setItem("selectedModel", defaultModel);
  }, [defaultModel]);

  useEffect(() => {
    if (modelOptions.length && !modelOptions.some(m => m.value === defaultModel)) {
      setDefaultModel(modelOptions[0].value);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [flattenedChat, streamedAnswer]);

  useEffect(() => {
    setFullScreenEditorOpen(false);
    setEditorBubbleId(null);
    setAssistantEditorOpen(false);
    setStreamedAnswer("");
    setLoading(false);
    setStreaming(false);
  }, [memory]);

useEffect(() => {
  async function fetchModels() {
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (Array.isArray(data.models)) {
        setModelOptions(data.models);
        // LocalStorage veya ilk model:
        const saved = localStorage.getItem("selectedModel");
        if (saved && data.models.some(m => m.value === saved)) {
          setDefaultModel(saved);
        } else if (data.models.length) {
          setDefaultModel(data.models[0].value);
        }
      }
    } catch (err) {
      setModelOptions([]);
    }
  }
  fetchModels();
}, []);
useEffect(() => {
  if (defaultModel) localStorage.setItem("selectedModel", defaultModel);
}, [defaultModel]);
  
  function onEditBubble(content, id) {
    console.log(`onEditBubble: ${content}, ${id}`); 
    setEditorInitialValue(content ?? "");
    setEditorBubbleId(id);
    setFullScreenEditorOpen(true);
  }
  function onEditAssistantBubble(content) {
    setAssistantEditorInitialValue(content ?? "");
    setAssistantEditorOpen(true);
  }
  function getBubbleFontSize() {
    return `${Math.round(16 * bubbleFontScale)}px`;
  }
  function copyToClipboard(text, label = "Panoya Kopyalandı!") {
    if (!text) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success(label));
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(label);
    }
  }

  async function handleReplayUntil(targetId) {
    if (!defaultModel) return;
    setLoading(true);
    await fetchWithLog(`/api/chat/replay_until/${targetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: defaultModel }),
    });
    setLoading(false);
  }
  async function handleReplay() {
    if (!defaultModel) return;
    setLoading(true);
    await fetchWithLog('/api/chat/replay', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: defaultModel }),
    });
    setLoading(false);
  }
async function handleReset() {
  if (window.confirm("Konuşma hafızası ve aktif işler tamamen sıfırlansın mı?")) {
    setLoading(true);
    await fetchWithLog('/api/chat/restart', { method: 'POST' });
    setLoading(false);
    setStreamedAnswer("");
    setStreaming(false);
    setLastTps(0);
    // Diğer tüm state'leri de sıfırlayabilirsin.
  }
}

  async function onFullScreenEditorDone(value) {
    setFullScreenEditorOpen(false);
    if (editorBubbleId) {
      try {
        const res = await fetchWithLog(`/api/chat/${editorBubbleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        const data = await res.json();
        if (data.status !== "ok") alert("Mesaj güncellenemedi: " + (data.error || ""));
      } catch (err) {
        alert("Bir hata oluştu: " + err);
      }
      setEditorBubbleId(null);
    }
  }

  function handleAssistantInsert(afterId) {
    console.log("handleAssistantInsert", afterId);
    setInsertAfterId(afterId);
    setInsertModalOpen(true);
  }
  async function handleInsertModalDone(content) {
    if (!insertAfterId || !content.trim()) {
      setInsertAfterId(null);
      setInsertModalOpen(false);
      return;
    }
    await fetchWithLog("/api/chat/insert_after", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ after_id: insertAfterId, role: "user", content }),
    });
    setInsertAfterId(null);
    setInsertModalOpen(false);
  }

async function sendMessage(e) {
  e.preventDefault();
  if (!message.trim() || !defaultModel) return;

  setLoading(true);
  setStreaming(true);
  setStreamedAnswer("");
  setLastTps(null);

  // --- Mesajı hemen temizle ve inputa fokus at ---
  setMessage("");
  inputRef.current?.focus();

  try {
    const resp = await fetch("/api/chat/ask_stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model: defaultModel }),
    });

    if (resp.status === 409) {
      toast.error("Zaten bir işlem çalışıyor! Lütfen bitmesini veya durdurulmasını bekleyin.");
      setStreaming(false);
      setLoading(false);
      return;
    }

    if (!resp.body) throw new Error("Stream başlatılamadı!");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunk.split(/\r?\n/).forEach((line) => {
        if (!line.startsWith("data:")) return;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) return;

        try {
          const payload = JSON.parse(jsonStr);
          switch (payload.type) {
            case "partial_assistant":
              setStreamedAnswer(payload.content);
              break;
            case "end":
              setStreamedAnswer("");
              setLastTps(payload.tps || null);
              break;
            default:
              break;
          }
        } catch {
          setStreamedAnswer((prev) => prev + jsonStr);
        }
      });
    }
  } catch (err) {
    toast.error("Stream error: " + err.message);
  } finally {
    setStreaming(false);
    setLoading(false);
    // --- Yine de bir kez daha fokus ata (async flow için) ---
    inputRef.current?.focus();
  }
}


  async function handleStop() {
    await fetch("/api/chat/stop", { method: "POST" });
    setStreaming(false);
    setLoading(false);
  }

  // --- RENDER ---
  return (
    <div style={styles.panel}>
  
<div style={toolbarStyle}>
<div style={{
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginRight: 18,
  minWidth: 110,
  fontWeight: 600,
  fontSize: 15,
  color: statusMap[agentStatus.state]?.color ?? "#ffe066",
  letterSpacing: 0.3,
}}>
  {getStatusUI(agentStatus.state, lastTps)}
</div>
<select
  style={selectStyle}
  value={defaultModel}
  onChange={e => {
    setDefaultModel(e.target.value);
    updateSettings({ defaultModel: e.target.value });
  }}
  title="Model seç"
  disabled={!defaultModel || modelOptions.length === 0}
>
  {modelOptions.map(m => (
    <option key={m.value} value={m.value}>{m.label}</option>
  ))}
</select>
  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
   
   <button
        style={
          jobActive
            ? { ...toolbarBtnRed, marginRight: 9 }
            : toolbarBtn
        }
        onClick={
          jobActive
            ? handleStop // Aktif job varken stop fonksiyonu
            : handleReplay // Normalde replay fonksiyonu
        }
        title={jobActive ? "Durdur" : "Replay / Yeniden Çalıştır"}
        disabled={loading}
      >
        {jobActive ? (
          <StopCircle size={26} />
        ) : (
          <Play size={26} />
        )}
      </button>
    <button onClick={handleReset} style={toolbarBtnRed} title="Reset / Sıfırla" disabled={loading}>
      <RotateCw size={26} />
    </button>
  </div>
</div>
      <div style={styles.chatContainer}>
        {flattenedChat.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 30 }}>
            Sohbete başlamak için mesaj yazın.
          </div>
        )}
        {flattenedChat.map((item, idx) => {
          const key = item.meta?.id || idx;
          if (item.type === "chat") {
            if (item.role === "system") {
              return (
                <div key={key} style={{ ...styles.systemBubble, fontSize: getBubbleFontSize(), position: "relative" }}>
                  <div style={iconOverlayStyle}>
                    <button onClick={() => onEditBubble(item.content, item["meta"]["id"])} style={iconButtonStyle} title="Sistem mesajını düzenle">
                      <Edit2 size={15} />
                    </button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <MarkdownMessage
                      content={item.content}
                      showImagePreview={showImagePreview}
                      codeLineNumbers={showCodeLineNumbers}
                      codeWrap={codeWrap}
                      fontSize={getBubbleFontSize()}
                    />
                  </div>
                </div>
              );
            }
            if (item.role === "user") {
              return (
                <div key={item["meta"]["id"]} style={{ ...styles.userBubble, fontSize: getBubbleFontSize(), position: "relative" }}>
                  <div style={bubbleIconOverlayStyle}>
                    <Terminal size={19} style={{ color: "#99f6e4" }} />
                  </div>
                  <div style={iconOverlayStyle}>
                    <button onClick={() => copyToClipboard(item.content)} style={iconButtonStyle} title="Panoya kopyala">
                      <Copy size={18} />
                    </button>
                    <button onClick={() => onEditBubble(item.content, item["meta"]["id"])} style={iconButtonStyle} title="Düzenle">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Bu mesajı ve sonraki tüm mesajları silmek istiyor musunuz?")) {
                          await fetchWithLog(`/api/chat/delete_after/${item["meta"]["id"]}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                          });
                        }
                      }}
                      style={iconButtonStyle}
                      title="Bu prompt ve sonrasını sil"
                    >
                      <Trash2 size={16}  />
                      {/* istersen farklı bir ikon da koyabilirsin */}
                    </button>

                    <button
                      onClick={async () => {
                        //if (window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
                          await fetchWithLog(`/api/chat/bulk_delete`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ids: [item["meta"]["id"]] }),
                          });
                        //}
                      }}
                      style={iconButtonStyle}
                      title="Mesajı sil"
                    >
                      <Scissors size={16} />
                    </button>
                    
                    <button onClick={() => handleReplayUntil(item["meta"]["id"])} style={iconButtonStyle} title="Bu promptu tekrar çalıştır">
                      <Play size={16} />
                    </button>
                  </div>
                  <MarkdownMessage
                    content={item.content}
                    showImagePreview={showImagePreview}
                    codeLineNumbers={showCodeLineNumbers}
                    codeWrap={codeWrap}
                    fontSize={getBubbleFontSize()}
                  />
                </div>
              );
            }
            if (item.role === "assistant") {
              return (
                <div key={item["meta"]["id"]} style={{ ...styles.botBubble, fontSize: getBubbleFontSize(), position: "relative" }}>
                  <div style={bubbleIconOverlayStyle}>
                    <Bot size={19} style={{ color: "#99f6e4" }} />
                  </div>
                  <div style={iconOverlayStyle}>
                    <button onClick={() => copyToClipboard(item.content)} style={iconButtonStyle} title="Panoya kopyala">
                      <Copy size={18} />
                    </button>
                    <button onClick={() => onEditAssistantBubble(item.content)} style={iconButtonStyle} title="Cevabı tam ekran görüntüle">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleAssistantInsert(item["meta"]["id"])} style={iconButtonStyle} title="Bu cevabın sonrasına prompt ekle">
                      <Plus size={16} />
                    </button>
                  </div>
                  <MarkdownMessage
                    content={item.content}
                    showImagePreview={showImagePreview}
                    codeLineNumbers={showCodeLineNumbers}
                    codeWrap={codeWrap}
                    fontSize={getBubbleFontSize()}
                  />
                </div>
              );
            }
          }
          if (item.type === "tool_combo") {
            return <ToolCallWithResult key={item.call?.id || idx} call={item.call} result={item.result} />;
          }
          return null;
        })}

        {/* Streaming (canlı) cevap balonu */}
        {streamedAnswer && (
          <div style={{ ...styles.botBubble, fontSize: getBubbleFontSize(), position: "relative", opacity: 0.8 }}>
            <div style={bubbleIconOverlayStyle}>
              <Bot size={19} style={{ color: "#99f6e4" }} />
            </div>
            <MarkdownMessage
              content={streamedAnswer}
              showImagePreview={showImagePreview}
              codeLineNumbers={showCodeLineNumbers}
              codeWrap={codeWrap}
              fontSize={getBubbleFontSize()}
            />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
      <div style={styles.inputWrapper}>
        <form style={styles.form} onSubmit={sendMessage}>
          <TextareaAutosize
            ref={inputRef}
            style={styles.textarea}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            minRows={1}
            maxRows={8}
            disabled={loading}
            onKeyDown={e => {
              if (enterToSend && e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.target.form.requestSubmit();
              }
            }}
          />

          {!jobActive ? (
            <button
              type="submit"
              style={styles.sendButton}
              disabled={loading || !message.trim()}
              title="Gönder"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              style={{
                ...styles.sendButton,
                background: "#b91c1c",
                color: "#fff",
                fontWeight: 700
              }}
              onClick={handleStop}
              title="Durdur"
            >
              <StopCircle size={18} />
            </button>
          )}


        </form>
      </div>
      <FullScreenCodeEditor
        open={fullScreenEditorOpen}
        initialValue={editorInitialValue}
        language="markdown"
        title=""
        onDone={onFullScreenEditorDone}
        onCancel={() => setFullScreenEditorOpen(false)}
      />
      <FullScreenCodeEditor
        open={insertModalOpen}
        initialValue=""
        language="markdown"
        title="Yeni Prompt Ekle"
        onDone={handleInsertModalDone}
        onCancel={() => {
          setInsertAfterId(null);
          setInsertModalOpen(false);
        }}
      />
      <FullScreenCodeEditor
        open={assistantEditorOpen}
        initialValue={assistantEditorInitialValue}
        language="markdown"
        title="Cevap (Salt-okunur)"
        readOnly={true}
        onDone={() => setAssistantEditorOpen(false)}
        onCancel={() => setAssistantEditorOpen(false)}
      />
    </div>
  );
}