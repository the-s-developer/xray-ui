import React, { useEffect, useState, useRef } from "react";
import FullScreenCodeEditor from "./FullScreenCodeEditor";
import { Play, Edit2, Maximize2, Copy, Trash2, ClipboardPaste } from "lucide-react";
import { fetchWithLog } from "./utils/fetchWithLog";
import { useCallContext } from "./CallContext"; 
import toast from "react-hot-toast";

export default function ScriptPanel() {
  const [code, setCode] = useState(() => localStorage.getItem("scriptpanel_code") || "");
  const [result, setResult] = useState(() => localStorage.getItem("scriptpanel_result") || "");
  const [logs, setLogs] = useState(() => localStorage.getItem("scriptpanel_logs") || "");
  const { registerToolHandler, connected } = useCallContext();

  const [editorOpen, setEditorOpen] = useState(false);
  const [resultFullOpen, setResultFullOpen] = useState(false);
  const [logsFullOpen, setLogsFullOpen] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => { localStorage.setItem("scriptpanel_code", code); }, [code]);
  useEffect(() => { localStorage.setItem("scriptpanel_result", result); }, [result]);
  useEffect(() => { localStorage.setItem("scriptpanel_logs", logs); }, [logs]);

  useEffect(() => {
    const unregister = registerToolHandler("scriptpanel__save_script", async (args) => {
      setCode(args.code || "");
      setEditorOpen(false);
      setResult("");
      setLogs("");
      return { status: "ok", code: args.code };
    });
    return () => { unregister && unregister(); };
  }, [registerToolHandler]);

  async function runScript() {
    setLoading(true);
    setResult("");
    setLogs("Çalıştırılıyor...");
    try {
      const res = await fetchWithLog("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: "scraper__run_python_scraper_script",
          params: { "python_code":code }
        }),
      });

      let data = await res.json();

      if (typeof data.output === "string") {
        try {
          data = JSON.parse(data.output);
        } catch {
          setResult(data.output);
          setLogs("");
          setLoading(false);
          return;
        }
      } else if (typeof data.output === "object") {
        data = data.output;
      }

      if (typeof data === "object" && data.result !== undefined) {
        setResult(
          typeof data.result === "string" || typeof data.result === "number"
            ? String(data.result)
            : JSON.stringify(data.result, null, 2)
        );
        setLogs(data.logs || "");
      } else {
        setResult(JSON.stringify(data, null, 2));
        setLogs("");
      }
    } catch (e) {
      setResult("Çalıştırırken hata: " + e.message);
      setLogs("");
    }
    setLoading(false);
  }

  function copyToClipboard(text, label = "Panoya Kopyalandı!") {
    if (!text) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(label); // Başarı mesajı

      });
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

  async function pasteFromClipboard() {
    const text = await navigator.clipboard.readText();
    if (text) setCode(text);
  }

  return (
    <div style={{ padding: 24, color: "#111", minHeight: "100vh", background: "#f8fafc" }}>
      {/* HEADER */}
      <div style={{
        fontWeight: 600, marginBottom: 10, fontSize: 16,
        letterSpacing: 0.4, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            display: "inline-block",
            width: 10, height: 10,
            background: connected ? "#16a34a" : "#f87171",
            borderRadius: 6
          }} />
          Script Simulator
        </div>
      </div>

      {/* Kod Blok*/}
      <div style={{
        background: "#18181b",
        color: "#fafafa",
        borderRadius: 8,
        padding: 0,
        fontFamily: "Fira Mono, Menlo, monospace",
        fontSize: 11,
        marginBottom: 12,
        minHeight: 160,
        maxHeight: 340,
        overflow: "hidden",
        boxShadow: "0 2px 8px #0001",
        position: "relative"
      }}>
        {/* ÜSTTEKİ ICONLAR */}
        <div style={{
          position: "absolute", top: 14, right: 14, zIndex: 3, display: "flex", gap: 8
        }}>
          <button
            onClick={() => { setCode(""); setResult(""); setLogs(""); }}
            disabled={!code}
            title="Reset Content"
            style={{
              background: "#18181b", border: "none", color: "#f5f5f5",
              borderRadius: 10, padding: 6, width: 38, height: 38,
              cursor: !code ? "not-allowed" : "pointer", opacity: !code ? 0.6 : 1
            }}
          >
            <Trash2 size={19} />
          </button>
          <button
            onClick={() => setEditorOpen(true)}
            title="Tam ekran kod editörü"
            style={{
              background: "#18181b", border: "none", color: "#f5f5f5",
              borderRadius: 10, padding: 6, width: 38, height: 38,
              cursor: "pointer"
            }}
          >
            <Edit2 size={19} />
          </button>
          <button
            onClick={() => copyToClipboard(code)}
            title="Kodu panoya kopyala"
            style={{
              background: "#18181b", border: "none", color: "#ffc700",
              borderRadius: 10, padding: 6, width: 38, height: 38,
              cursor: "pointer"
            }}
          >
            <Copy size={19} />
          </button>
          <button
            onClick={pasteFromClipboard}
            title="Panodan yapıştır"
            style={{
              background: "#18181b", border: "none", color: "#f5f5f5",
              borderRadius: 10, padding: 6, width: 38, height: 38,
              cursor: "pointer"
            }}
          >
            <ClipboardPaste size={19} />
          </button>
        </div>
        {/* KOD */}
       <div
          style={{
            position: "relative",
            minHeight: 140,
            maxHeight: 340,
            height: 500, // Sabit bir yükseklik, istersen farklı verebilirsin
            background: "#18181b",
            color: "#fafafa",
            overflow: "hidden", // Dışta scroll yok
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre",
              padding: 16,
              minHeight: "100%",
              maxHeight: "100%",
              height: "100%",
              overflowY: "auto", // <--- asıl scroll burada!
              overflowX: "auto",
            }}
          >
            {code}
          </pre>
        </div>
        <button
          style={{
            position: "absolute", right: 18, bottom: 18,
            background: "#6366f1", color: "#fff",
            border: "none", borderRadius: "50%",
            width: 46, height: 46,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 23,
            cursor: loading || !code ? "not-allowed" : "pointer",
            opacity: loading || !code ? 0.5 : 1,
            boxShadow: "0 2px 8px #6366f133"
          }}
          onClick={runScript}
          disabled={loading || !code}
          title="Çalıştır"
        >
          <Play size={24} />
        </button>
      </div>

      {/* ÇIKTI PANELİ (aynı eski düzen) */}
      <div style={{
        display: "flex",
        gap: 24,
        marginTop: 8,
        flexWrap: "wrap"
      }}>
        {/* Result Alanı */}
        <div style={{
          flex: "1 1 320px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            color: "#2d3748",
            marginBottom: 6,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>Result</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                title="Tam ekran"
                style={{
                  background: "#e0e7ef",
                  border: "none",
                  color: "#222",
                  borderRadius: 7,
                  padding: 3,
                  cursor: "pointer",
                  display: "flex", alignItems: "center"
                }}
                onClick={() => setResultFullOpen(true)}
                disabled={!result}
              >
                <Maximize2 size={16} />
              </button>
              <button
                title="Panoya kopyala"
                style={{
                  background: "#e0e7ef",
                  border: "none",
                  color: "#222",
                  borderRadius: 7,
                  padding: 3,
                  cursor: "pointer",
                  display: "flex", alignItems: "center"
                }}
                onClick={() => copyToClipboard(result)}
                disabled={!result}
              >
                <Copy size={16} />
              </button>
            </span>
          </div>
          <div style={{
            background: "#e0e7ef",
            color: "#222",
            borderRadius: 8,
            padding: 12,
            minHeight: 80,
            maxHeight: 220,
            overflow: "auto",
            fontFamily: "Fira Mono, Menlo, monospace",
            fontSize: 15,
            whiteSpace: "pre-wrap"
          }}>
            {result ? result : <span style={{ color: "#888" }}></span>}
          </div>
        </div>
        {/* Logs Alanı */}
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div style={{
            color: "#2d3748",
            marginBottom: 6,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>Logs</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                title="Tam ekran"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  color: "#334155",
                  borderRadius: 7,
                  padding: 3,
                  cursor: "pointer",
                  display: "flex", alignItems: "center"
                }}
                onClick={() => setLogsFullOpen(true)}
                disabled={!logs}
              >
                <Maximize2 size={16} />
              </button>
              <button
                title="Panoya kopyala"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  color: "#334155",
                  borderRadius: 7,
                  padding: 3,
                  cursor: "pointer",
                  display: "flex", alignItems: "center"
                }}
                onClick={() => copyToClipboard(logs)}
                disabled={!logs}
              >
                <Copy size={16} />
              </button>
            </span>
          </div>
          <div style={{
            background: "#f1f5f9",
            color: "#334155",
            borderRadius: 8,
            padding: 12,
            minHeight: 80,
            maxHeight: 220,
            overflow: "auto",
            fontFamily: "Fira Mono, Menlo, monospace",
            fontSize: 14,
            whiteSpace: "pre-wrap"
          }}>
            {logs ? logs : <span style={{ color: "#888" }}></span>}
          </div>
        </div>
      </div>

      {/* Fullscreen Editor - Kod Editörü (KAYDET aktif) */}
      <FullScreenCodeEditor
        open={editorOpen}
        initialValue={code}
        language="python"
        title="Script Editor"
        readOnly={false}
        onDone={value => {
          setCode(value);
          setResult("");
          setLogs("");
          setEditorOpen(false);
        }}
        onCancel={() => setEditorOpen(false)}
      />
      {/* Result Fullscreen */}
      <FullScreenCodeEditor
        open={resultFullOpen}
        initialValue={result}
        language="json"
        title="Result"
        onDone={() => setResultFullOpen(false)}
        onCancel={() => setResultFullOpen(false)}
        readOnly={true}
      />
      {/* Logs Fullscreen */}
      <FullScreenCodeEditor
        open={logsFullOpen}
        initialValue={logs}
        language="plaintext"
        title="Logs"
        onDone={() => setLogsFullOpen(false)}
        onCancel={() => setLogsFullOpen(false)}
        readOnly={true}
      />
    </div>
  );
}
