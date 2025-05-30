// src/ChatPanel.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { useLogContext } from "./LogContext";
import { Play, Send, Edit2,Eye, Plus, RotateCw, Trash2, Copy, Bot,Terminal, SquareTerminal } from "lucide-react";

import TextareaAutosize from "react-textarea-autosize";
import MarkdownMessage from "./MarkdownMessage";
import FullScreenCodeEditor from "./FullScreenCodeEditor";
import { ToolCallWithResult, ToolResultSummary } from "./ToolCallMessage";
import { useSettings } from "./SettingsContext";
import { fetchWithLog } from "./utils/fetchWithLog";

const MODELS = [
  { value: "gpt-4.1-nano", label: "gpt-4.1-nano 0.4$ (1M)" },
  { value: "gpt-4.1-mini", label: "gpt-4.1-mini 1.6$ (1M)" },
  { value: "gpt-4.1", label: "gpt-4.1 8$ (1M)" },
  { value: "gpt-4o", label: "gpt-4o 10$ (128K)" },
  { value: "gpt-4o-mini", label: "gpt-4o-mini 0.6$ (128K)" },
  { value: "o4-mini", label: "o4-mini 4.4$ (200K)" },
  { value: "o3", label: "o3 40$ (200K)" },
  { value: "o3-mini", label: "o3-mini 4.4$ (8K)" },
  { value: "o1", label: "o1 60$ (16K)" },
  { value: "o1-mini", label: "o1-mini 4.4$ (8K)" },
];

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
  userBubble: { 
    background: "#6366f1", 
    color: "#fff", 
    borderRadius: "14px 14px 2px 14px", 
    paddingLeft: "30px", 
    paddingTop: "10px", 
    paddingBottom: "10px", 
    paddingRight: "10px", 
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
    paddingLeft: "30px", 
    paddingTop: "10px", 
    paddingBottom: "10px", 
    paddingRight: "10px", 
    marginBottom: 8, 
    fontWeight: 400, 
    wordBreak: "break-word", 
    width: "100%", 
    boxSizing: "border-box", 
    position: "relative" 
  },
  systemBubble: { background: "#7f1d1d", color: "#fff", border: "2px solid #ef4444", borderRadius: 13, marginBottom: 12, padding: "11px 18px", fontWeight: 600, position: "relative" },
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
  console.log("flattendd", memory);
  if (!memory?.messages) return [];
  const result = [];
  let lastToolCall = null;
  for (const msg of memory.messages) {
    if (msg.role === "user" || msg.role === "assistant" || msg.role === "system") {
      if (msg.content !== null)
        result.push({ type: "chat", ...msg });
      if (showTools && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          lastToolCall = { ...tc, parentRole: msg.role, id: msg.id };
        }
      }
    } else if (showTools && msg.role === "tool") {
      if (lastToolCall) {
        result.push({
          type: "tool_combo",
          call: lastToolCall,
          result: msg,
        });
        lastToolCall = null;
      } else {
        result.push({ type: "tool_result", ...msg });
      }
    }
  }
  return result;
}

export default function ChatPanel({ memory }) {
   useEffect(() => {
    console.log("ChatPanel useEffect-> memory:", memory);
  }, [memory]);
  


  const { logs, setLogs } = useLogContext();
  const { settings, updateSettings } = useSettings();
  const { showImagePreview, showCodeLineNumbers, codeWrap, enterToSend, bubbleFontScale } = settings;

  const modelOptions = MODELS;

  const [defaultModel, setDefaultModel] = useState(() =>
    localStorage.getItem("selectedModel") ||
    (modelOptions.length ? modelOptions[0].value : "")
  );

  const [assistantEditorOpen, setAssistantEditorOpen] = useState(false);
  const [assistantEditorInitialValue, setAssistantEditorInitialValue] = useState("");

    // ChatPanel içinde, memory değiştikçe editörleri de kapat:
    useEffect(() => {
      setFullScreenEditorOpen(false);
      setEditorBubbleId(null);
    }, [memory]);

  useEffect(() => {
    if (defaultModel) {
      localStorage.setItem("selectedModel", defaultModel);
    }
  }, [defaultModel]);

  useEffect(() => {
    if (modelOptions.length && !modelOptions.some(m => m.value === defaultModel)) {
      setDefaultModel(modelOptions[0].value);
    }
    // eslint-disable-next-line
  }, []);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullScreenEditorOpen, setFullScreenEditorOpen] = useState(false);
  const [editorInitialValue, setEditorInitialValue] = useState("");
  const [editorBubbleId, setEditorBubbleId] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [insertAfterId, setInsertAfterId] = useState(null);
  const [insertModalOpen, setInsertModalOpen] = useState(false);

  const chatEndRef = useRef();
  const flattenedChat = getFlattenedChat(memory, true);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [flattenedChat]);
    function onEditAssistantBubble(content) {
      setAssistantEditorInitialValue(content ?? "");
      setAssistantEditorOpen(true);
    }

  function getBubbleFontSize() {
    // 16px baz alınır
    return `${Math.round(16 * bubbleFontScale)}px`;
  }

  function copyToClipboard(text) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
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
    if (window.confirm("Konuşma hafızası tamamen sıfırlansın mı?")) {
      setLoading(true);
      await fetchWithLog('/api/chat/reset', { method: 'POST' });
      setLoading(false);
    }
  }

  function onEditBubble(content, id) {
    console.log("onEditBubble called with content:", content, "and id:", id);
    setEditorInitialValue(content ?? "");
    setEditorBubbleId(id);
    setFullScreenEditorOpen(true);
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

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length} mesajı ve ilgili tüm yanıtları silinsin mi?`)) return;
    await fetchWithLog(`/api/chat/bulk_delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setSelectedIds([]);
  }

  function handleAssistantInsert(afterId) {
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
  const isIdSelected = (id) => selectedIds.includes(id);

  return (
    <div style={styles.panel}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
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
          <button onClick={handleReplay} style={toolbarBtn} title="Replay / Yeniden Çalıştır" disabled={loading}>
            <Play size={26} />
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
          const key = item.id;

          if (item.type === "chat") {
           if (item.role === "system") {
                return (
                  <div key={key} style={{ ...styles.systemBubble, fontSize: getBubbleFontSize(), position: "relative" }}>
                    <div style={iconOverlayStyle}>
                      <button
                        onClick={() => onEditBubble(item.content, item.id)}
                        style={iconButtonStyle}
                        title="Sistem mesajını düzenle"
                      >
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
                <div
                  key={item.id}
                  style={{
                    ...styles.userBubble,
                    fontSize: getBubbleFontSize(),
                    position: "relative"
                  }}
                >
                <div style={bubbleIconOverlayStyle}>
                  <Terminal size={19} style={{ color: "#99f6e4" }} />
                </div>  
                  {/* ICON OVERLAY */}
                  <div style={iconOverlayStyle}>
                    <button
                      onClick={() => copyToClipboard(item.content)}
                      style={iconButtonStyle}
                      title="Panoya kopyala"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => onEditBubble(item.content, item.id)}
                      style={iconButtonStyle}
                      title="Düzenle"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
                          await fetchWithLog(`/api/chat/bulk_delete`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ids: [item.id] }),
                          });
                        }
                      }}
                      style={iconButtonStyle}
                      title="Mesajı sil"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleReplayUntil(item.id)}
                      style={iconButtonStyle}
                      title="Bu promptu tekrar çalıştır"
                    >
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
              <div key={item.id} style={{ ...styles.botBubble, fontSize: getBubbleFontSize(), position: "relative" }}>
                {/* SOL ÜSTTE BOT */}
                <div style={bubbleIconOverlayStyle}>
                  <Bot size={19} style={{ color: "#99f6e4" }} />
                </div>                
                <div style={iconOverlayStyle}>
                  <button
                    onClick={() => copyToClipboard(item.content)}
                    style={iconButtonStyle}
                    title="Panoya kopyala"
                  >
                    <Copy size={18} />
                  </button>
                  {/* Edit yerine Eye/view */}
                  <button
                    onClick={() => onEditAssistantBubble(item.content)}
                    style={iconButtonStyle}
                    title="Cevabı tam ekran görüntüle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleAssistantInsert(item.id)}
                    style={iconButtonStyle}
                    title="Bu cevabın sonrasına prompt ekle"
                  >
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
          if (item.type === "tool_result") {
            return <ToolResultSummary key={item.tool_call_id || idx} tool_call_id={item.tool_call_id} content={item.content} />;
          }
          return null;
        })}
        <div ref={chatEndRef} />
      </div>
      <div style={styles.inputWrapper}>
          <form
            style={styles.form}
            onSubmit={async e => {
              e.preventDefault();
              if (!message.trim() || !defaultModel) return;
              setLoading(true);
              try {
                await fetchWithLog("/api/chat/ask", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message, model: defaultModel }), // client_id yok!
                }, setLogs);
              } catch (err) {}
              setMessage("");
              setLoading(false);
            }}
          >
          <TextareaAutosize
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
          <button
            type="submit"
            style={styles.sendButton}
            disabled={loading || !message.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      {/* Tam ekran editörü: mesaj düzenleme */}
      <FullScreenCodeEditor
        open={fullScreenEditorOpen}
        initialValue={editorInitialValue}
        language="markdown"
        title=""
        onDone={onFullScreenEditorDone}
        onCancel={() => setFullScreenEditorOpen(false)}
      />
      {/* Tam ekran ekleme editörü */}
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
