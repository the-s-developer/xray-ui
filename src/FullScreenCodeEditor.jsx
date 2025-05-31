// src/FullScreenCodeEditor.jsx
import React, { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Minimize2, Save, ClipboardCopy, ClipboardPaste } from "lucide-react"; // 🔹
import toast from "react-hot-toast"; // Panoya işlemlerde bildirim için önerilir

const LANGUAGES = [
  { label: "Markdown", value: "markdown" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSON", value: "json" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "Bash", value: "shell" },
  { label: "YAML", value: "yaml" },
];

export default function FullScreenCodeEditor({
  open,
  initialValue = "",
  language = "python",
  onDone,
  onCancel,
  title = "Kod Editörü",
  readOnly = false
}) {
  const [value, setValue] = useState(initialValue);
  const [currentLang, setCurrentLang] = useState(language);

  // Her açılışta ilk değeri ve dili güncelle
  useEffect(() => { setValue(initialValue ?? ""); }, [initialValue, open]);
  useEffect(() => { setCurrentLang(language ?? "python"); }, [language, open]);

  // ESC ve Ctrl+Enter ile kapatma/kaydetme
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel && onCancel();
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        onDone && onDone(value);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onDone, onCancel, value]);

  if (!open) return null;

  // 🔹 Clipboard helper
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      toast.success("Kod panoya kopyalandı!");
    } catch (err) {
      toast.error("Kopyalama başarısız!");
    }
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setValue(clip ?? "");
      toast.success("Panodan yapıştırıldı!");
    } catch (err) {
      toast.error("Panodan okuma başarısız!");
    }
  };

  return (
    <div style={{
      position: "fixed",
      left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 1000,
      background: "rgba(24,25,27,0.98)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        width: "80vw", boxShadow: "0 8px 36px #0008", borderRadius: 12,
        background: "#18181b", display: "flex", flexDirection: "column"
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "5px 5px", background: "#212128", borderRadius: "12px 12px 0 0"
        }}>
          <span style={{ fontWeight: 600, fontSize: 12, color: "#cbeafe" }}>
            {title}
            <span style={{ fontWeight: 400, color: "#cbd5e1", fontSize: 11, marginLeft: 5 }}>
              <span style={{ opacity: 0.75 }}>Kısayol:</span> <b>Ctrl+Enter</b> ile Kaydet, <b>Esc</b> ile Kapat
            </span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Dil seçici */}
            <select
              value={currentLang}
              onChange={e => setCurrentLang(e.target.value)}
              style={{
                background: "#18181b", color: "#facc15", border: "1.5px solid #18181b",
                borderRadius: 7, fontSize: 12, padding: "4px 14px", marginRight: 4, outline: "none",
                minWidth: 110, height: 30, fontWeight: 600, letterSpacing: 1, appearance: "none"
              }}
              title="Dili değiştir"
            >
              {LANGUAGES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Panoya kopyala */}
            <button
              onClick={handleCopy}
              style={{
                background: "#262634", color: "#fff", border: "none", borderRadius: 8,
                width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
              title="Panoya kopyala"
            >
              <ClipboardCopy size={19} />
            </button>
            {/* Panodan yapıştır */}
            {!readOnly && (
              <button
                onClick={handlePaste}
                style={{
                  background: "#262634", color: "#fff", border: "none", borderRadius: 8,
                  width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Panodan yapıştır"
              >
                <ClipboardPaste size={19} />
              </button>
            )}
            {/* Kaydet */}
            {!readOnly && (
              <button
                onClick={() => onDone(value)}
                style={{
                  background: "#262634", color: "#fff", border: "none", borderRadius: 8,
                  width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Kaydet"
              >
                <Save size={20} />
              </button>
            )}
            {/* Kapat */}
            <button
              onClick={onCancel}
              style={{
                background: "none", border: "none", color: "#eee", fontSize: 24,
                cursor: "pointer", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center"
              }}
              title="Kapat"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </div>
        {/* Monaco Editor */}
        <MonacoEditor
          height="80vh"
          language={currentLang}
          theme="vs-dark"
          value={value}
          onChange={val => setValue(val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 10,
            fontFamily: "Fira Mono, Menlo, monospace",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            scrollbar: { vertical: "auto", horizontal: "auto" },
            readOnly: !!readOnly
          }}
        />
      </div>
    </div>
  );
}
