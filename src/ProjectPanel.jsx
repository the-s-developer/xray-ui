import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Edit2, Save, X, Upload, Download, Copy, Maximize2, Play, Trash2, RotateCw, ClipboardPaste, List
} from "lucide-react";
import FullScreenCodeEditor from "./FullScreenCodeEditor";
import toast from "react-hot-toast";
import { fetchWithLog } from "./utils/fetchWithLog";

const PAGE_SIZE = 10;


async function fetchProjects() {
  const res = await fetchWithLog("/api/project");
  return await res.json();
}
async function fetchScripts(projectId) {
  const res = await fetchWithLog(`/api/project/${projectId}/script`);
  return await res.json();
}
async function fetchExecutions(
  projectId,
  { page = 1, pageSize = 20, scriptId = "", status = "" } = {}
) {
  let url = `/api/project/${projectId}/execution?page=${page}&page_size=${pageSize}`;
  if (scriptId) url += `&script_id=${scriptId}`;
  if (status) url += `&status=${status}`;
  const res = await fetch(url);
  return await res.json(); // Beklenen: {executions, total}
}


function formatDate(dt) {
  if (!dt) return "-";
  return new Date(dt).toLocaleString();
}


// Ortak stil
const iconBtnStyle = {
  background: "#18181b",
  border: "none",
  color: "#f5f5f5",
  borderRadius: 10,
  padding: 7,
  width: 38,
  height: 38,
  cursor: "pointer",
  fontSize: 20,
  marginLeft: 3,
  transition: "background 0.13s"
};
// Buton stili
const dialogIconBtnStyle = {
  background: "#6366f1",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: 52,
  height: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 25,
  boxShadow: "0 2px 16px #6366f133",
  cursor: "pointer",
  transition: "background 0.18s, transform 0.18s",
  outline: "none",
};

const dialogIconBtnStyleCancel = {
  ...dialogIconBtnStyle,
  background: "#f87171",
  color: "#fff"
};

const dialogIconBtnStyleDisabled = {
  ...dialogIconBtnStyle,
  background: "#c7d2fe",
  color: "#fff",
  cursor: "not-allowed",
  opacity: 0.75
};

export default function ProjectPanel() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ projectName: "", projectDescription: "" });
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef();

  // Script & execution state
  const [scripts, setScripts] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [filteredExecutions, setFilteredExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [codeReadOnlyOpen, setCodeReadOnlyOpen] = useState(false);

  // Script edit/new modalları
  const [editScriptOpen, setEditScriptOpen] = useState(false);
  const [editScriptCode, setEditScriptCode] = useState("");
  const [newScriptOpen, setNewScriptOpen] = useState(false);
  const [newScriptCode, setNewScriptCode] = useState("");

  // Script çalıştırma state
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState("");
  const [runLogs, setRunLogs] = useState("");
  const [runError, setRunError] = useState("");
  const [runPanelOpen, setRunPanelOpen] = useState(false);

  const [scriptTab, setScriptTab] = useState("output"); // "output" veya "logs"
  const [outputFullOpen, setOutputFullOpen] = useState(false);
  const [logsFullOpen, setLogsFullOpen] = useState(false);

  const [execModalOpen, setExecModalOpen] = useState(false);



  // Projeleri yükle
  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);

  // Proje seçilince script ve execution çek
  useEffect(() => {
    if (!selected) {
      setScripts([]);
      setExecutions([]); // Array olarak sıfırla
      setSelectedScript(null);
      setSelectedExecution(null);
      return;
    }
    fetchScripts(selected.projectId).then(scs => {
      setScripts(scs);
      setSelectedScript(scs[0] || null);
    });
    fetchExecutions(selected.projectId).then(res => {
      setExecutions(res.executions || res || []); // Sadece array!
    });
  }, [selected]);

  // Script değişince executionları filtrele
  useEffect(() => {
    // Emin olmak için array olduğundan emin ol
    const arr = Array.isArray(executions) ? executions : (executions.executions || []);
    if (!selectedScript) {
      setFilteredExecutions([]);
      setSelectedExecution(null);
      return;
    }
    const ex = arr.filter(e => e.scriptId === selectedScript.scriptId);
    setFilteredExecutions(ex);
    setSelectedExecution(ex[ex.length - 1] || null);
  }, [selectedScript, executions]);

  // Edit script code sync
  useEffect(() => {
    if (selectedScript) setEditScriptCode(selectedScript.code);
  }, [selectedScript]);

  // Edit/new açıldığında formu doldur
  useEffect(() => {
    setForm({
      projectName: selected?.projectName || "",
      projectDescription: selected?.projectDescription || ""
    });
  }, [selected, editMode]);
  // Proje seçilince current_project endpointine bildir
  useEffect(() => {
    if (selected && selected.projectId) {
      fetchWithLog("/api/project/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selected.projectId })
      })
        .then(async res => {
          if (!res) {
            const errorData = await res.json().catch(() => ({}));
            toast.error("Projeyi context olarak ayarlama hatası: " + (errorData?.detail || res.statusText));
          }
        })
        .catch(err => {
          toast.error("Projeyi context olarak kaydederken hata oluştu: " + err.message);
        });
    }
  }, [selected]);


  const sortedExecutions = [...filteredExecutions].sort(
    (a, b) => new Date(b.startTime) - new Date(a.startTime)
  );
  const lastExecutions = sortedExecutions.slice(0, 10);
  useEffect(() => {
    if (lastExecutions.length > 0) {
      setSelectedExecution(lastExecutions[0]);
    } else {
      setSelectedExecution(null);
    }
  }, [lastExecutions.length, selectedScript?.scriptId]);

  function copyToClipboard(text, label = "Kopyalandı!") {
    if (!text) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(label);
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

  async function handleDeleteProject() {
    if (!selected || !selected.projectId) return;
    const ok = window.confirm(
      `"${selected.projectName}" adlı projeyi ve tüm bağlı verileri silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz!`
    );
    if (!ok) return;
    try {
      await fetchWithLog(`/api/project/${selected.projectId}`, { method: "DELETE" });
      toast.success("Proje silindi!");
      setProjects(ps => ps.filter(p => p.projectId !== selected.projectId));
      setSelected(null);
      setEditMode(false);
    } catch (err) {
      toast.error("Proje silinemedi: " + err.message);
    }
  }

  async function handleRunSelectedScript() {
    if (!selected || !selectedScript) return;
    setRunLoading(true);
    setRunResult("");
    setRunLogs("");
    setRunError("");
    setRunPanelOpen(true);
    try {
      const res = await fetchWithLog(`/api/project/${selected.projectId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: selectedScript.scriptId })
      });
      const data = await res.json();
      setRunResult(
        typeof data?.execution?.output === "string"
          ? data.execution.output
          : JSON.stringify(data.execution.output || data.execution.result, null, 2)
      );
      setRunLogs(data.execution.logs || "");
      setRunError(data.execution.errorMessage || "");

      // Çalıştırma geçmişini tekrar yükle
      const executionsRes = await fetchWithLog(`/api/project/${selected.projectId}/execution`);
      const executionsData = await executionsRes.json();
      setExecutions(executionsData);

      const currentScriptExecutions = (executionsData.executions || []).filter(
        ex => ex.scriptId === selectedScript.scriptId
      );

      setFilteredExecutions(currentScriptExecutions);
      setSelectedExecution(currentScriptExecutions[0] || null);
    } catch (err) {
      setRunResult("");
      setRunLogs("");
      setRunError("Çalıştırma sırasında hata oluştu: " + err.message);
    }
    setRunLoading(false);
  }

  // -- PROMPT ENDPOINTLERİ --
  async function handleLoadPromptsToChat() {
    if (!selected?.prompts || selected.prompts.length === 0) {
      alert("Bu projede yüklü prompt yok!");
      return;
    }
    const ok = window.confirm(
      "Projeden promptları chat ekranına yüklemek üzeresiniz. Mevcut chat promptları silinecek ve yenileri yüklenecek. Devam edilsin mi?"
    );
    if (!ok) return;
    await fetchWithLog("/api/chat/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompts: selected.prompts }),
    });
  }

  async function handleSavePromptsFromChat() {
    const res = await fetchWithLog("/api/chat/prompts");
    const prompts = await res.json();
    if ((selected?.prompts?.length || 0) > 0) {
      const ok = window.confirm("Bu projede zaten prompt var. Eski promptlar silinerek yenileri kaydedilecek. Devam edilsin mi?");
      if (!ok) return;
    }
    await fetchWithLog(`/api/project/${selected.projectId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompts),
    });
    setSelected(s => ({ ...s, prompts }));
    setProjects(list =>
      list.map(p =>
        p.projectId === selected.projectId ? { ...p, prompts } : p
      )
    );
  }

  async function handleSaveProject() {
    if (!form.projectName.trim()) return;
    try {
      let proj;
      if (selected && selected.projectId) {
        // Güncelleme
        const res = await fetchWithLog(`/api/project/${selected.projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        proj = await res.json();
        toast.success("Proje güncellendi!");
      } else {
        // Yeni proje ekleme
        const res = await fetchWithLog("/api/project", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        proj = await res.json();
        toast.success("Yeni proje eklendi!");
      }

      // Listeyi güncelle
      const projectsRes = await fetchProjects();
      setProjects(projectsRes);

      setSelected(proj);
      setEditMode(false);
    } catch (err) {
      toast.error("Kaydetme başarısız: " + err.message);
    }
  }

  // --- SCRIPT ENDPOINTLER ---
  async function handleRefreshScripts() {
    if (!selected) return;
    fetchScripts(selected.projectId).then(setScripts);
    fetchExecutions(selected.projectId).then(setExecutions);
    toast.success("Script versiyonları yenilendi!");
  }

  async function handleUpdateScript(value) {
    if (!selectedScript) return;
    // Güncel scripti güncelle (PUT)
    const res = await fetchWithLog(`/api/project/${selected.projectId}/script/${selectedScript.scriptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: value,
        // notes: "isteğe bağlı not"
      }),
    });
    const updatedScript = await res.json();

    setEditScriptOpen(false);
    const updatedScripts = await fetchScripts(selected.projectId);
    setScripts(updatedScripts);
    const updated = updatedScripts.find(s => s.scriptId === selectedScript.scriptId);
    setSelectedScript(updated || updatedScripts[0] || null);
    toast.success(
      `Script başarıyla güncellendi (versiyon: v${updatedScript.version})`
    );
  }

  async function handleSaveNewScript(value) {
    try {
      await fetchWithLog(`/api/project/${selected.projectId}/script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: value,
          createdBy: "user",
        }),
      });
      setNewScriptOpen(false);
      setNewScriptCode("");
      const newScripts = await fetchScripts(selected.projectId);
      setScripts(newScripts);
      setSelectedScript(newScripts[0] || null);
      toast.success("Yeni script versiyonu eklendi!");
    } catch (err) {
      toast.error("Script eklenemedi: " + err.message);
    }
  }

  async function handleDeleteScript() {
    if (!selectedScript) return;
    if (!window.confirm("Bu script versiyonunu silmek istediğinize emin misiniz?")) return;
    await fetchWithLog(`/api/project/${selected.projectId}/script/${selectedScript.scriptId}`, { method: "DELETE" });
    fetchScripts(selected.projectId).then((scripts) => {
      setScripts(scripts);
      setSelectedScript(scripts[0] || null);
    });
    toast.success("Script silindi!");
  }

  function handleNewProject() {
    setSelected(null);
    setForm({ projectName: "", projectDescription: "" });
    setEditMode(true);
    setSelectedScript(null);
    setSelectedExecution(null);
  }

  function handleEditProject() {
    setEditMode(true);
  }


  function handleCancel() {
    setEditMode(false);
    if (!selected) setForm({ projectName: "", projectDescription: "" });
  }
  const filtered = projects.filter(p =>
    (p.projectName || "").toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div style={{ minHeight: "100vh", background: "#f4f5fa" }}>
      {/* HEADER BAR */}
      <div style={{
        background: "#fff", padding: 16, borderBottom: "1.5px solid #e5e7eb", position: "relative", zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div ref={searchRef} style={{ flex: 1, position: "relative" }}>
            <input
              placeholder="Proje ara..."
              value={search}
              onFocus={() => setExpanded(true)}
              onChange={e => { setSearch(e.target.value); setExpanded(true); }}
              style={{
                width: "100%", padding: "11px 38px 11px 15px",
                fontSize: 18, borderRadius: 9, border: "1.4px solid #e5e7eb",
                background: "#f7f8fa", fontWeight: 500
              }}
            />
            <div style={{
              maxHeight: expanded ? 320 : 0,
              overflow: "hidden",
              transition: "max-height .25s cubic-bezier(.37,1.14,.55,1)",
              background: "#f8fafc", marginTop: 7, borderRadius: 10,
              boxShadow: expanded ? "0 8px 24px #6366f122" : "none",
              border: expanded ? "1.2px solid #e5e7eb" : "none",
              position: "absolute",
              left: 0, right: 0,
              zIndex: 20,
            }}>
              {expanded && (
                <div style={{ padding: "7px 0" }}>
                  {filtered.length === 0 && (
                    <div style={{ color: "#999", textAlign: "center", padding: 20 }}>Proje bulunamadı.</div>
                  )}
                  {filtered.map(p => (
                    <div
                      key={p.projectId}
                      style={{
                        padding: "10px 22px", cursor: "pointer", fontSize: 16, borderRadius: 7,
                        background: "#fff", margin: "2px 10px",
                        border: "1.2px solid #f3f4f6", marginBottom: 4, transition: ".13s"
                      }}
                      onClick={() => { setSelected(p); setExpanded(false); }}
                    >
                      <b>{p.projectName}</b> <span style={{ color: "#666", fontSize: 13, marginLeft: 11 }}>{p.projectDescription}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            style={{
              marginLeft: 10, background: "#6366f1", color: "#fff",
              border: "none", borderRadius: 9, width: 42, height: 42, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
            }}
            title="Yeni Proje"
            onClick={handleNewProject}
          >
            <Plus size={23} />
          </button>
        </div>
      </div>
      {/* PROJE DETAY */}
      <div>
        {editMode ? (
          <div style={{
            background: "#fff", borderRadius: 12, margin: "1px auto",
            maxWidth: "100%", boxShadow: "0 8px 32px #1e293b08", padding: "1px 36px 36px 36px"
          }}>
            <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 18 }}>
              {selected ? "Edit Project" : "New Project"}
            </div>
            <input
              style={{
                background: "#f8fafc", border: "1.8px solid #e0e7ef",
                borderRadius: 13, padding: "16px 18px", fontSize: 22,
                fontWeight: 700, width: "100%", marginBottom: 18
              }}
              value={form.projectName}
              onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
              placeholder="Project Name"
            />
            <textarea
              style={{
                background: "#f8fafc", border: "1.8px solid #e0e7ef",
                borderRadius: 13, padding: "14px 18px", fontSize: 17, width: "100%", fontWeight: 400,
                minHeight: 54, resize: "vertical", marginBottom: 18
              }}
              value={form.projectDescription}
              onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
              placeholder="Project Description (optional)"
            />
            <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "flex-end", alignItems: "center" }}>
              <button
                onClick={handleSaveProject}
                style={{
                  ...(form.projectName.trim() ? dialogIconBtnStyle : dialogIconBtnStyleDisabled),
                }}
                title="Save Project"
                disabled={!form.projectName.trim()}
              >
                <Save size={27} />
              </button>
              <button
                onClick={handleCancel}
                style={dialogIconBtnStyleCancel}
                title="Cancel"
              >
                <X size={27} />
              </button>

            </div>
          </div>
        ) : selected ? (
          <div style={{
            background: "#fff", borderRadius: 12, margin: "1px auto",
            maxWidth: "100%", boxShadow: "0 8px 32px #1e293b08", padding: "32px 36px 36px 36px"
          }}>

            {/* Proje adı ve açıklama + PROMPT SYNC BUTONLARI */}

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#64748b", fontSize: 16, margin: "4px 0 10px 2px" }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Project ID:</span>
                  <span style={{ marginLeft: 6, fontFamily: "monospace", background: "#f1f5f9", padding: "2px 7px", borderRadius: 6 }}>{selected.projectId}</span>
                </div>


                <div style={{ fontSize: 27, fontWeight: 700 }}>{selected.projectName}</div>
                <div style={{ color: "#475569", fontSize: 18, marginTop: 3 }}>{selected.projectDescription}</div>
              </div>
              <button onClick={handleEditProject} style={{
                background: "#6366f1", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 22px", fontWeight: 700, fontSize: 17, cursor: "pointer"
              }}><Edit2 size={20} /></button>
              <button
                title="Projeyi sil"
                onClick={handleDeleteProject}
                style={{
                  background: "#f87171",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: "pointer",
                  marginLeft: 6
                }}
              >
                <Trash2 size={20} />
              </button>
              <button
                title="Projeden chat'e promptları yükle"
                onClick={handleLoadPromptsToChat}
                style={{
                  background: "#34d399", color: "#fff", border: "none", borderRadius: 8,
                  padding: "8px 18px", fontWeight: 700, fontSize: 17, cursor: "pointer", marginLeft: 6
                }}>
                <Upload size={20} style={{ marginRight: 5, marginBottom: -3 }} />
              </button>
              <button
                title="Chat'ten projeye promptları kaydet"
                onClick={handleSavePromptsFromChat}
                style={{
                  background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
                  padding: "8px 18px", fontWeight: 700, fontSize: 17, cursor: "pointer", marginLeft: 6
                }}>
                <Download size={20} style={{ marginRight: 5, marginBottom: -3 }} />
              </button>

            </div>
            <div style={{ color: "#9ca3af", fontSize: 14, margin: "2px 0 16px 2px" }}>
              {formatDate(selected.updatedAt)}
            </div>
            {/* Promptlar gösterimi */}
            {selected.prompts?.length > 0 && (
              <div style={{
                background: "#f8fafc",
                border: "1.5px solid #e5e7eb",
                borderRadius: 16,
                padding: "24px 24px 10px 24px",
                marginBottom: 28,
                marginTop: 8,
                boxShadow: "0 2px 12px #0ea5e933",
                maxHeight: 250,
                overflowY: "auto",
              }}>
                {selected.prompts.map((pr, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 18,
                      borderRadius: 10,
                      background: pr.type === "system" ? "#fef9c3" : "#ecfeff",
                      border: pr.type === "system"
                        ? "1.2px solid #fde047"
                        : "1.2px solid #22d3ee",
                      padding: "10px 16px",
                      boxShadow: pr.type === "system"
                        ? "0 2px 8px #fde04733"
                        : "0 2px 8px #22d3ee33",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: pr.type === "system" ? "#d97706" : "#0ea5e9",
                        fontSize: 15,
                        minWidth: 66,
                        textTransform: "uppercase",
                        letterSpacing: ".02em",
                        marginTop: 2,
                      }}
                    >
                      {pr.type}
                    </span>
                    <span
                      style={{
                        color: "#1e293b",
                        fontSize: 16,
                        whiteSpace: "pre-wrap"
                      }}
                    >
                      {pr.content}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Script versiyonu seç */}
            <div style={{
              marginBottom: 24,
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Scripts:</div>
              <select
                value={selectedScript?.scriptId || ""}
                onChange={e => {
                  const s = scripts.find(s => s.scriptId === e.target.value);
                  setSelectedScript(s);
                }}
                style={{
                  fontSize: 17,
                  borderRadius: 8,
                  padding: "7px 18px",
                  minWidth: 270,
                  flex: 1,
                  marginLeft: 12
                }}
              >
                {scripts.map(s =>
                  <option key={s.scriptId} value={s.scriptId}>v{s.version} - {formatDate(s.createdAt)}</option>
                )}
              </select>
              {/* --- Sağdaki renkli script işlemleri --- */}
              <button
                onClick={handleRefreshScripts}
                title="Scriptleri yenile"
                style={{
                  ...iconBtnStyle,
                  background: "#ecfeff",
                  color: "#0ea5e9"
                }}
              ><RotateCw size={19} /></button>
              <button
                onClick={() => setNewScriptOpen(true)}
                title="Yeni Script Versiyonu"
                style={{
                  ...iconBtnStyle,
                  background: "#22c55e",
                  color: "#fff"
                }}
              ><Plus size={19} /></button>
              <button
                onClick={handleDeleteScript}
                title="Scripti Sil"
                style={{
                  ...iconBtnStyle,
                  background: "#f87171",
                  color: "#fff"
                }}
                disabled={!selectedScript}
              ><Trash2 size={19} /></button>
            </div>


            {/* KOD BLOĞU ve Çalıştır */}
            {selectedScript && (
              <div style={{
                marginTop: 0, marginBottom: 16, position: "relative"
              }}>
                <div style={{
                  background: "#18181b",
                  color: "#fafafa",
                  borderRadius: 20,
                  padding: 26,
                  fontFamily: "Fira Mono, Menlo, monospace",
                  fontSize: 17,
                  marginBottom: 8,
                  minHeight: 140,
                  maxHeight: 340,
                  overflow: "auto",
                  boxShadow: "0 2px 8px #0001",
                  position: "relative"
                }}>
                  {/* SAĞ ÜST İKONLAR */}
                  <div style={{
                    position: "absolute", top: 16, right: 18,
                    display: "flex", gap: 18, zIndex: 5
                  }}>
                    {/* Düzenle */}
                    <button
                      onClick={() => { setEditScriptOpen(true); setEditScriptCode(selectedScript.code); }}
                      title="Kodu Düzenle"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fafafa",
                        fontSize: 19,
                        padding: 0,
                        cursor: "pointer"
                      }}>
                      <Edit2 size={20} />
                    </button>
                    {/* Kopyala */}
                    <button
                      onClick={() => copyToClipboard(selectedScript.code, "panoya kopyalandı!")}
                      title="Kodu panoya kopyala"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fde047",
                        fontSize: 19,
                        padding: 0,
                        cursor: "pointer"
                      }}>
                      <Copy size={20} />
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    whiteSpace: "pre"
                  }}>{selectedScript.code}</pre>
                  {/* Çalıştırma butonu */}
                  <button
                    onClick={handleRunSelectedScript}
                    title="Scripti Çalıştır"
                    style={{
                      position: "absolute",
                      right: 32,
                      bottom: 24,
                      background: "#6366f1",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 54,
                      height: 54,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 23,
                      cursor: runLoading ? "not-allowed" : "pointer",
                      opacity: runLoading ? 0.7 : 1,
                      boxShadow: "0 2px 8px #6366f122",
                      zIndex: 3
                    }}
                    disabled={runLoading}
                  >
                    <Play size={26} />
                  </button>
                </div>
                <div style={{ color: "#999", fontSize: 13, marginLeft: 8 }}>{formatDate(selectedScript.createdAt)}</div>
              </div>
            )}


            {/* Edit/New Modal aynı şekilde (full screen yok!) */}
            <FullScreenCodeEditor
              open={editScriptOpen}
              initialValue={editScriptCode}
              language="python"
              title="Script Versiyonunu Düzenle (Yeni Versiyon Olarak Kaydedilir)"
              onDone={handleUpdateScript} // value parametre olarak gelir
              onCancel={() => setEditScriptOpen(false)}
            />

            <FullScreenCodeEditor
              open={newScriptOpen}
              initialValue={newScriptCode}
              language="python"
              title="Yeni Script Versiyonu Ekle"
              onDone={handleSaveNewScript} // value parametre olarak gelir
              onCancel={() => setNewScriptOpen(false)}
            />

            {/* Çalıştırma geçmişi ve detay paneli */}
            <div>
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  margin: "20px 0 2px 0"
                }}>
                  <b style={{ fontSize: 17, color: "#444" }}>Son Çalıştırmalar</b>
                  <button style={{
                    border: "none", background: "#e0e7ef", color: "#444", borderRadius: 7, padding: "4px 14px", cursor: "pointer"
                  }} onClick={() => setExecModalOpen(true)}>
                    <List size={18} style={{ marginRight: 6, marginBottom: -2 }} />
                  </button>
                </div>
                {lastExecutions.map(ex => (
                  <div
                    key={ex.executionId + ex.startTime}
                    onClick={() => setSelectedExecution(ex)}
                    style={{
                      padding: "8px 18px",
                      borderBottom: "1px solid #e5e7eb",
                      background: selectedExecution?.executionId === ex.executionId && selectedExecution?.startTime === ex.startTime ? "#e0e7ff" : "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <b>{ex.status}</b> <span style={{ color: "#64748b" }}>{formatDate(ex.startTime)}</span> v{ex.scriptVersion}
                  </div>
                ))}
              </div>
              {/* Seçili çalıştırmanın detay paneli */}
              {selectedScript && selectedExecution && (
                <div style={{
                  background: "#f8fafc", borderRadius: 13, boxShadow: "0 2px 12px #0001",
                  marginBottom: 28, marginTop: 6, padding: "0 0 10px 0"
                }}>
                  {/* Sekmeler */}
                  <div style={{
                    display: "flex", borderBottom: "1.4px solid #e0e7ef", alignItems: "center"
                  }}>
                    <button
                      style={{
                        padding: "12px 30px 10px 28px",
                        border: "none",
                        borderBottom: scriptTab === "output" ? "2.5px solid #6366f1" : "none",
                        background: "none",
                        fontWeight: 600,
                        fontSize: 17,
                        color: scriptTab === "output" ? "#3b3c48" : "#7b8399",
                        cursor: "pointer"
                      }}
                      onClick={() => setScriptTab("output")}
                    >Output</button>
                    <button
                      style={{
                        padding: "12px 30px 10px 28px",
                        border: "none",
                        borderBottom: scriptTab === "logs" ? "2.5px solid #6366f1" : "none",
                        background: "none",
                        fontWeight: 600,
                        fontSize: 17,
                        color: scriptTab === "logs" ? "#3b3c48" : "#7b8399",
                        cursor: "pointer"
                      }}
                      onClick={() => setScriptTab("logs")}
                    >Logs</button>
                  </div>
                  {/* İçerik */}
                  <div style={{ padding: 0 }}>
                    {/* Output Tabı */}
                    {scriptTab === "output" && (
                      <div style={{ position: "relative" }}>
                        {/* İkonlar */}
                        <div style={{
                          position: "absolute", top: 10, right: 16, display: "flex", gap: 8, zIndex: 2
                        }}>
                          <button
                            title="Tam ekran"
                            style={{
                              background: "#e0e7ef",
                              border: "none",
                              color: "#222",
                              borderRadius: 7,
                              padding: 3,
                              cursor: "pointer"
                            }}
                            onClick={() => setOutputFullOpen(true)}
                            disabled={!selectedExecution.output}
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
                              cursor: "pointer"
                            }}
                            onClick={() => copyToClipboard(selectedExecution.output)}
                            disabled={!selectedExecution.output}
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        {/* İçerik */}
                        <pre style={{
                          background: "#e0e7ef",
                          color: "#222",
                          borderRadius: 10,
                          padding: "16px 32px 16px 16px",
                          minHeight: 80,
                          maxHeight: 240,
                          overflow: "auto",
                          fontFamily: "Fira Mono, Menlo, monospace",
                          fontSize: 15,
                          marginTop: 0,
                          marginBottom: 0,
                          whiteSpace: "pre-wrap"
                        }}>
                          {typeof selectedExecution.output === "string"
                            ? selectedExecution.output
                            : JSON.stringify(selectedExecution.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {/* Logs Tabı */}
                    {scriptTab === "logs" && (
                      <div style={{ position: "relative" }}>
                        <div style={{
                          position: "absolute", top: 10, right: 16, display: "flex", gap: 8, zIndex: 2
                        }}>
                          <button
                            title="Tam ekran"
                            style={{
                              background: "#f1f5f9",
                              border: "none",
                              color: "#334155",
                              borderRadius: 7,
                              padding: 3,
                              cursor: "pointer"
                            }}
                            onClick={() => setLogsFullOpen(true)}
                            disabled={!selectedExecution.logs}
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
                              cursor: "pointer"
                            }}
                            onClick={() => copyToClipboard(selectedExecution.logs)}
                            disabled={!selectedExecution.logs}
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <pre style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          borderRadius: 10,
                          padding: "16px 32px 16px 16px",
                          minHeight: 80,
                          maxHeight: 240,
                          overflow: "auto",
                          fontFamily: "Fira Mono, Menlo, monospace",
                          fontSize: 14,
                          marginTop: 0,
                          marginBottom: 0,
                          whiteSpace: "pre-wrap"
                        }}>
                          {selectedExecution.logs || <span style={{ color: "#888" }}></span>}
                        </pre>
                      </div>
                    )}
                  </div>
                  {/* Fullscreen Output */}
                  <FullScreenCodeEditor
                    open={outputFullOpen}
                    initialValue={selectedExecution.output || ""}
                    language="json"
                    title="Output"
                    onDone={() => setOutputFullOpen(false)}
                    onCancel={() => setOutputFullOpen(false)}
                    readOnly={true}
                  />
                  {/* Fullscreen Logs */}
                  <FullScreenCodeEditor
                    open={logsFullOpen}
                    initialValue={selectedExecution.logs || ""}
                    language="plaintext"
                    title="Logs"
                    onDone={() => setLogsFullOpen(false)}
                    onCancel={() => setLogsFullOpen(false)}
                    readOnly={true}
                  />

                </div>

              )}

            </div>
          </div>
        ) : (
          <div style={{ color: "#aaa", fontSize: 21, margin: "100px auto", textAlign: "center" }}>
            Detay için bir proje seçin veya <b>+</b> butonuna tıklayın.
          </div>
        )}
      </div>


      {/* --- Çalıştırma Sonucu Paneli --- */}
      {runPanelOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0, zIndex: 5000,
          background: "rgba(28, 33, 44, 0.18)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 18,
            padding: 28,
            minWidth: 440,
            maxWidth: "90vw",
            boxShadow: "0 10px 40px #0003",
            position: "relative"
          }}>
            <button
              onClick={() => setRunPanelOpen(false)}
              style={{
                position: "absolute", top: 8, right: 8, background: "#e5e7eb", color: "#222",
                border: "none", borderRadius: 7, padding: "4px 8px", cursor: "pointer"
              }}
            ><X size={18} /></button>
            <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 10 }}>Script Çalıştır Sonucu</div>
            {runLoading ? (
              <div>Çalıştırılıyor...</div>
            ) : (
              <>
                <div style={{ fontWeight: 600, color: "#15803d", marginBottom: 8 }}>
                  {runError ? <span style={{ color: "#b91c1c" }}>Hata</span> : "Result"}
                </div>
                <pre style={{
                  background: "#f1f5f9",
                  color: "#18181b",
                  borderRadius: 8,
                  padding: 14,
                  minHeight: 80,
                  maxHeight: 260,
                  overflowY: "auto",
                  fontFamily: "Fira Mono, Menlo, monospace",
                  fontSize: 15
                }}>
                  {runError ? runError : runResult}
                </pre>
                {runLogs && (
                  <>
                    <div style={{ fontWeight: 600, color: "#0ea5e9", margin: "15px 0 5px 0" }}>Logs</div>
                    <pre style={{
                      background: "#eef6fb",
                      color: "#222",
                      borderRadius: 7,
                      padding: 11,
                      maxHeight: 120,
                      overflowY: "auto",
                      fontSize: 13,
                      marginBottom: 5
                    }}>
                      {runLogs}
                    </pre>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <ExecutionHistoryModal
        open={execModalOpen}
        onClose={() => setExecModalOpen(false)}
        projectId={selected?.projectId}
        scriptId={selectedScript?.scriptId}
        scripts={scripts}
      />
    </div>
  );
}



// ---- MODAL ----
function ExecutionHistoryModal({ open, onClose, projectId, scriptId, scripts }) {
  const [page, setPage] = useState(1);
  const [executions, setExecutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState(scriptId || "");

  // Output/Logs tabları ve fullscreen editör için state'ler
  const [execTab, setExecTab] = useState("output");
  const [outputFullOpen, setOutputFullOpen] = useState(false);
  const [logsFullOpen, setLogsFullOpen] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    fetchExecutions(projectId, {
      page,
      pageSize: PAGE_SIZE,
      scriptId: selectedScriptId
    }).then(res => {
      setExecutions(res.executions || []);
      setTotal(res.total || 0);
      setSelectedExecution((res.executions && res.executions[0]) || null);
      setLoading(false);
    });
  }, [open, projectId, page, selectedScriptId]);

  // execution değişince tabı sıfırla
  useEffect(() => {
    setExecTab("output");
  }, [selectedExecution]);

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 5000,
      background: "rgba(30,34,40,0.28)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, minWidth: 1000, minHeight: 540, maxWidth: "95vw", maxHeight: "95vh",
        boxShadow: "0 12px 48px #0005", display: "flex", flexDirection: "column", position: "relative"
      }}>
        {/* Kapat */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 15, right: 20, border: "none", background: "#e0e7ef", borderRadius: 6, padding: 6, cursor: "pointer" }}>
          <X size={21} />
        </button>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* SOL MASTER */}
          <div style={{
            width: 350, borderRight: "1.7px solid #e5e7eb", overflowY: "auto", padding: 0, display: "flex", flexDirection: "column"
          }}>
            <div style={{ display: "flex", alignItems: "center", padding: "18px 24px 10px 20px", background: "#f4f6fa", borderBottom: "1.3px solid #eee" }}>
              <List size={19} style={{ marginRight: 7 }} />
              <b>Çalıştırma Geçmişi</b>
            </div>
            <div style={{ padding: 12 }}>
              <select
                value={selectedScriptId}
                style={{ width: "100%", borderRadius: 7, border: "1.2px solid #e0e7ef", fontSize: 15, marginBottom: 9 }}
                onChange={e => { setSelectedScriptId(e.target.value); setPage(1); }}
              >
                <option value="">Tüm Scriptler</option>
                {scripts.map(s => (
                  <option key={s.scriptId} value={s.scriptId}>
                    v{s.version} - {formatDate(s.createdAt)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {loading ? <div style={{ padding: 40, textAlign: "center" }}>Yükleniyor...</div> :
                executions.length === 0 ? (
                  <div style={{ color: "#888", padding: 28, textAlign: "center" }}>Geçmiş yok</div>
                ) : (
                  executions.map(ex => (
                    <div
                      key={ex.executionId + ex.startTime}
                      onClick={() => setSelectedExecution(ex)}
                      style={{
                        padding: "9px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        background: selectedExecution?.executionId === ex.executionId ? "#e0e7ff" : "transparent",
                        cursor: "pointer"
                      }}
                    >
                      <b>{ex.status}</b>{" "}
                      <span style={{ color: "#64748b" }}>{formatDate(ex.startTime)}</span>
                      <br />
                      <span style={{ fontSize: 12, color: "#888" }}>v{ex.scriptVersion}</span>
                    </div>
                  ))
                )}
            </div>
            {/* Sayfalama */}
            <div style={{
              padding: "8px 24px",
              borderTop: "1.2px solid #e0e7ef",
              display: "flex", justifyContent: "center", alignItems: "center"
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ border: "none", background: "#e5e7eb", borderRadius: 7, padding: "4px 12px", marginRight: 7, cursor: page === 1 ? "not-allowed" : "pointer" }}
              >&lt;</button>
              <span style={{ fontSize: 14, fontWeight: 600, margin: "0 5px" }}>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
              <button
                onClick={() => setPage(p => (p * PAGE_SIZE < total ? p + 1 : p))}
                disabled={page * PAGE_SIZE >= total}
                style={{ border: "none", background: "#e5e7eb", borderRadius: 7, padding: "4px 12px", marginLeft: 7, cursor: page * PAGE_SIZE >= total ? "not-allowed" : "pointer" }}
              >&gt;</button>
            </div>
          </div>
          {/* SAĞ DETAY */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            padding: "32px 32px 32px 24px"
          }}>
            {!selectedExecution ? (
              <div style={{ color: "#aaa", padding: 64, textAlign: "center" }}>Bir kayıt seçin</div>
            ) : (
              <>
                {/* Başlık ve info */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 13 }}>Çalıştırma Detayı</div>
                  <div style={{ marginBottom: 14, fontSize: 14 }}>
                    <b>Status:</b> {selectedExecution.status} <br />
                    <b>Başlangıç:</b> {formatDate(selectedExecution.startTime)} <br />
                    <b>Script Version:</b> v{selectedExecution.scriptVersion}
                  </div>
                </div>
                {/* Tab ve içerik */}
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  {/* Tablar */}
                  <div style={{
                    display: "flex",
                    borderBottom: "1.4px solid #e0e7ef",
                    alignItems: "center"
                  }}>
                    <button
                      style={{
                        padding: "12px 30px 10px 28px",
                        border: "none",
                        borderBottom: execTab === "output" ? "2.5px solid #6366f1" : "none",
                        background: "none",
                        fontWeight: 600,
                        fontSize: 17,
                        color: execTab === "output" ? "#3b3c48" : "#7b8399",
                        cursor: "pointer"
                      }}
                      onClick={() => setExecTab("output")}
                    >Output</button>
                    <button
                      style={{
                        padding: "12px 30px 10px 28px",
                        border: "none",
                        borderBottom: execTab === "logs" ? "2.5px solid #6366f1" : "none",
                        background: "none",
                        fontWeight: 600,
                        fontSize: 17,
                        color: execTab === "logs" ? "#3b3c48" : "#7b8399",
                        cursor: "pointer"
                      }}
                      onClick={() => setExecTab("logs")}
                    >Logs</button>
                  </div>
                  {/* Output/Logs İçeriği */}
                  <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
                    {/* Output Tab */}
                    {execTab === "output" && (
                      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
                        {/* İkonlar */}
                        <div style={{
                          position: "absolute", top: 10, right: 16, display: "flex", gap: 8, zIndex: 2
                        }}>
                          <button
                            title="Tam ekran"
                            style={{
                              background: "#e0e7ef",
                              border: "none",
                              color: "#222",
                              borderRadius: 7,
                              padding: 3,
                              cursor: "pointer"
                            }}
                            onClick={() => setOutputFullOpen(true)}
                            disabled={!selectedExecution.output}
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
                              cursor: "pointer"
                            }}
                            onClick={() => {
                              if (navigator.clipboard && selectedExecution.output) {
                                navigator.clipboard.writeText(selectedExecution.output);
                              }
                            }}
                            disabled={!selectedExecution.output}
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <pre style={{
                          background: "#e0e7ef",
                          color: "#222",
                          borderRadius: 10,
                          padding: "16px 32px 16px 16px",
                          flex: 1,
                          minHeight: 0,
                          overflow: "auto",
                          fontFamily: "Fira Mono, Menlo, monospace",
                          fontSize: 15,
                          marginTop: 0,
                          marginBottom: 0,
                          whiteSpace: "pre-wrap"
                        }}>
                          {selectedExecution.output || <span style={{ color: "#888" }}></span>}
                        </pre>
                      </div>
                    )}
                    {/* Logs Tab */}
                    {execTab === "logs" && (
                      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
                        {/* İkonlar */}
                        <div style={{
                          position: "absolute", top: 10, right: 16, display: "flex", gap: 8, zIndex: 2
                        }}>
                          <button
                            title="Tam ekran"
                            style={{
                              background: "#f1f5f9",
                              border: "none",
                              color: "#334155",
                              borderRadius: 7,
                              padding: 3,
                              cursor: "pointer"
                            }}
                            onClick={() => setLogsFullOpen(true)}
                            disabled={!selectedExecution.logs}
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
                              cursor: "pointer"
                            }}
                            onClick={() => {
                              if (navigator.clipboard && selectedExecution.logs) {
                                navigator.clipboard.writeText(selectedExecution.logs);
                              }
                            }}
                            disabled={!selectedExecution.logs}
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <pre style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          borderRadius: 10,
                          padding: "16px 32px 16px 16px",
                          flex: 1,
                          minHeight: 0,
                          overflow: "auto",
                          fontFamily: "Fira Mono, Menlo, monospace",
                          fontSize: 14,
                          marginTop: 0,
                          marginBottom: 0,
                          whiteSpace: "pre-wrap"
                        }}>
                          {selectedExecution.logs || <span style={{ color: "#888" }}></span>}
                        </pre>
                      </div>
                    )}
                    {/* Fullscreen Editorlar */}
                    <FullScreenCodeEditor
                      open={outputFullOpen}
                      initialValue={selectedExecution.output || ""}
                      language="json"
                      title="Output"
                      onDone={() => setOutputFullOpen(false)}
                      onCancel={() => setOutputFullOpen(false)}
                      readOnly={true}
                    />
                    <FullScreenCodeEditor
                      open={logsFullOpen}
                      initialValue={selectedExecution.logs || ""}
                      language="plaintext"
                      title="Logs"
                      onDone={() => setLogsFullOpen(false)}
                      onCancel={() => setLogsFullOpen(false)}
                      readOnly={true}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
