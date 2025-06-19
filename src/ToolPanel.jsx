// src/ToolPanel.jsx
import React, { useState, useEffect } from "react";
import { Play, ChevronDown, ChevronRight, Terminal, Folder, XCircle, CheckCircle } from "lucide-react";
import { fetchWithLog } from "./utils/fetchWithLog";
import { useCallContext } from "./CallContext";

function groupByServer(tools) {
  const groups = {};
  for (const tool of tools) {
    const fn = tool.function || tool;
    const name = fn.name || "";
    const [prefix] = name.split("__");
    const group = prefix || "Diğer";
    if (!groups[group]) groups[group] = [];
    groups[group].push(tool);
  }
  return groups;
}

function ParameterRow({ parameters, values, onChange }) {
  if (!parameters?.properties) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, margin: "8px 0 0 3px" }}>
      {Object.entries(parameters.properties).map(([key, val]) => (
        <label key={key} style={{ display: "flex", flexDirection: "column", minWidth: 130, marginRight: 8, fontSize: 13, fontWeight: 500 }}>
          <span style={{ color: "#444", marginBottom: 3 }}>{key}
            {parameters.required?.includes(key) && <span style={{ color: "#e11d48", marginLeft: 2 }}>*</span>}
          </span>
          <input
            type={val.type === "number" || val.type === "integer" ? "number" : "text"}
            placeholder={val.description || key}
            value={values[key] ?? ""}
            required={parameters.required?.includes(key)}
            onChange={e => onChange(key, e.target.value)}
            style={{
              border: "1.5px solid #d1d5db",
              borderRadius: 6,
              padding: "7px 10px",
              fontSize: 14,
              marginBottom: 1,
              background: "#f6f8fa"
            }}
          />
          <span style={{ color: "#888", fontSize: 11, minHeight: 12 }}>{val.description || ""}</span>
        </label>
      ))}
    </div>
  );
}

function parseParamValues(fn, values) {
  const params = {};
  if (fn.parameters?.properties) {
    Object.entries(fn.parameters.properties).forEach(([key, prop]) => {
      let val = values[key];
      if (val === undefined || val === "") return;
      if (prop.type === "number") {
        val = Number(val);
        if (isNaN(val)) return;
      } else if (prop.type === "integer") {
        val = parseInt(val, 10);
        if (isNaN(val)) return;
      }
      params[key] = val;
    });
  }
  return params;
}

export function ToolsPanel() {
  const { toolsVersion } = useCallContext();
  const [tools, setTools] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [runResult, setRunResult] = useState({});
  const [running, setRunning] = useState({});
  const [paramValues, setParamValues] = useState({});
  const [groupExpanded, setGroupExpanded] = useState({});

  useEffect(() => {
    fetchWithLog("/api/tools")
      .then(res => res.json())
      .then(data => setTools(data.tools || data));
  }, [toolsVersion]);

  const onParamChange = (toolName, key, value) => {
    setParamValues(prev => ({
      ...prev,
      [toolName]: { ...prev[toolName], [key]: value }
    }));
  };

  const handleExpand = (group, idx) =>
    setExpanded(exp => ({ ...exp, [`${group}_${idx}`]: !exp[`${group}_${idx}`] }));

  const handleGroupExpand = group =>
    setGroupExpanded(exp => ({ ...exp, [group]: !exp[group] }));

  const runTool = async (tool) => {
    const fn = tool.function || tool;
    const name = fn.name;
    const params = parseParamValues(fn, paramValues[name] || {});
    setRunning(r => ({ ...r, [name]: true }));
    setRunResult(rr => ({ ...rr, [name]: null }));

    try {
      const res = await fetchWithLog("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_name: name, params }),
      });
      const data = await res.json();
      setRunResult(rr => ({ ...rr, [name]: data }));
    } catch (e) {
      setRunResult(rr => ({ ...rr, [name]: { error: e.message } }));
    }
    setRunning(r => ({ ...r, [name]: false }));
  };

  const grouped = groupByServer(tools);

  return (
    <div style={{ padding: "18px 0", background: "#f4f7fb", minHeight: "100vh" }}>
      {Object.entries(grouped).map(([group, tools]) => (
        <div key={group} style={{
          marginBottom: 24,
          borderRadius: 14,
          boxShadow: groupExpanded[group] ? "0 2px 18px #b7cef622" : "0 1px 6px #c3cbe509",
          background: "#fff",
          border: groupExpanded[group] ? "2.3px solid #6366f1" : "1.5px solid #e0e7ef",
          transition: "box-shadow 0.13s,border 0.13s"
        }}>
          <div
            onClick={() => handleGroupExpand(group)}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 19,
              background: groupExpanded[group] ? "#ede9fe" : "#f1f5f9",
              borderRadius: "13px 13px 0 0",
              padding: "13px 24px",
              borderBottom: groupExpanded[group] ? "1.5px solid #6366f1" : "1px solid #e0e7ef"
            }}>
            <Folder size={22} style={{ marginRight: 12, color: "#6366f1" }} />
            {group}
            <span style={{ flex: 1 }} />
            {groupExpanded[group] ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
          </div>
          {groupExpanded[group] && (
            <div style={{ marginTop: 2, padding: "8px 10px 8px 20px" }}>
              {tools.map((tool, i) => {
                const fn = tool.function || tool;
                const name = fn.name;
                const hasParams = !!(fn.parameters?.properties && Object.keys(fn.parameters.properties).length);
                return (
                  <div
                    key={name}
                    style={{
                      background: expanded[`${group}_${i}`] ? "#f3f6fd" : "#f8fafc",
                      border: expanded[`${group}_${i}`] ? "1.7px solid #6366f1" : "1.2px solid #e4e7ec",
                      borderRadius: 12,
                      marginBottom: 12,
                      boxShadow: expanded[`${group}_${i}`] ? "0 2px 14px #b7cef624" : "none",
                      padding: "14px 18px 8px 18px",
                      display: "flex",
                      flexDirection: "column",
                      transition: "background .13s, box-shadow .13s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Terminal size={17} color="#6366f1" style={{ marginRight: 10 }} />
                      <span style={{ fontWeight: 600, fontSize: 15, flex: 1, letterSpacing: 0.2 }}>{name.split("__")[1] || name}</span>
                      <span style={{ color: "#999", fontSize: 12, flex: 2, marginLeft: 10, opacity: 0.92 }}>
                        {fn.description?.split(".")[0]}
                      </span>
                      {hasParams && (
                        <button
                          onClick={() => handleExpand(group, i)}
                          style={{
                            marginLeft: 18,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            borderRadius: 7,
                            padding: "4px 4px"
                          }}
                          title={expanded[`${group}_${i}`] ? "Detayları gizle" : "Detayları göster"}
                        >
                          {expanded[`${group}_${i}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      )}
                    <button
                      onClick={() => runTool(tool)}
                      disabled={running[name]}
                      style={{
                        marginLeft: 15,
                        background: running[name] ? "#c7d2fe" : "#6366f1",
                        color: running[name] ? "#6366f1" : "#fff",
                        border: "none",
                        borderRadius: "50%",
                        padding: 0,
                        width: 38,
                        height: 38,
                        minWidth: 38,
                        minHeight: 38,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: running[name] ? "not-allowed" : "pointer",
                        boxShadow: running[name] ? "none" : "0 1px 5px #6366f133",
                        transition: "background 0.12s"
                      }}
                      title={running[name] ? "Çalışıyor..." : "Çalıştır"}
                    >
                      <Play size={19} />
                    </button>
                    </div>
                    {(expanded[`${group}_${i}`] || hasParams) && (
                      <div>
                        <ParameterRow
                          parameters={fn.parameters}
                          values={paramValues[name] || {}}
                          onChange={(key, value) => onParamChange(name, key, value)}
                        />
                        <div style={{ color: "#555", fontSize: 13, marginTop: 9, fontStyle: "italic" }}>
                          {fn.description}
                        </div>
                      </div>
                    )}
                    {/* Run Result/Hata */}
                    {runResult[name] && (
                      <CollapsibleResult
                        result={runResult[name]}
                        name={name}
                        key={name + "_result"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Sonuç paneli collapse/gösterilebilir
function CollapsibleResult({ result, name }) {
  const [open, setOpen] = useState(true);
  let output = result.output;

  // Basit başarılı/gözükür badge
  let status = result.error
    ? <span style={{ color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center" }}><XCircle size={16} style={{ marginRight: 5 }} /> Hata</span>
    : <span style={{ color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center" }}><CheckCircle size={16} style={{ marginRight: 5 }} /> Başarılı</span>;

  if (typeof output === "object") output = JSON.stringify(output, null, 2);

  return (
    <div style={{
      marginTop: 9,
      background: result.error ? "#fef2f2" : "#f1f5fa",
      borderRadius: 9,
      border: result.error ? "1.5px solid #ef4444" : "1.5px solid #a5b4fc",
      padding: "12px 14px",
      color: result.error ? "#dc2626" : "#222",
      fontSize: 14,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
        <button
          style={{
            border: "none", background: "none", cursor: "pointer", padding: 2,
            fontWeight: 700, fontSize: 17, marginRight: 6, color: "#6366f1"
          }}
          onClick={() => setOpen(v => !v)}
          title={open ? "Sonucu gizle" : "Sonucu göster"}
        >
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {status}
      </div>
      {open && (
        <pre style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          fontFamily: "Fira Mono, Menlo, monospace",
          background: "none",
          fontSize: 14,
          color: result.error ? "#dc2626" : "#222"
        }}>
          {result.error ? result.error : (output || "")}
        </pre>
      )}
    </div>
  );
}
