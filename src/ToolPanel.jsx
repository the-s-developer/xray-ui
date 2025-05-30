import React from "react";
import { useState, useEffect } from "react";
import { Play, ChevronDown, ChevronRight, Terminal, Folder } from "lucide-react";
import { fetchWithLog } from "./utils/fetchWithLog";
import { useBridgeWebSocket } from "./BridgeWebSocketContext";

// Araçları prefix'e göre gruplar (ör: investigator, storage vs.)
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

// Parametre tipine göre otomatik input tipi
function ParameterRow({ parameters, values, onChange }) {
  if (!parameters?.properties) return null;
  return (
    <div style={{ display: "flex", gap: 12, margin: "12px 0 0 4px" }}>
      {Object.entries(parameters.properties).map(([key, val]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", minWidth: 120 }}>
          <input
            type={val.type === "number" || val.type === "integer" ? "number" : "text"}
            placeholder={val.description || key}
            value={values[key] ?? ""}
            required={parameters.required?.includes(key)}
            onChange={e => onChange(key, e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 14,
              marginBottom: 3
            }}
          />
          <span style={{ color: "#888", fontSize: 11, minHeight: 12 }}>{val.description || key}</span>
        </div>
      ))}
    </div>
  );
}

// Parametreleri tipine göre parse eder (number, integer, string)
function parseParamValues(fn, values) {
  const params = {};
  if (fn.parameters?.properties) {
    Object.entries(fn.parameters.properties).forEach(([key, prop]) => {
      let val = values[key];
      if (val === undefined || val === "") return;
      if (prop.type === "number") {
        val = Number(val);
        if (isNaN(val)) return; // Hatalı input yok sayılır
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
  const { eventData } = useBridgeWebSocket();
  const toolsVersion = eventData.toolsVersion || 0;  
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
    <div>
      <div>
        {Object.entries(grouped).map(([group, tools]) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div
              onClick={() => handleGroupExpand(group)}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 17,
                margin: "7px 0",
                background: "#f3f4f6",
                borderRadius: 8,
                padding: "8px 16px"
              }}>
              <Folder size={19} style={{ marginRight: 10 }} />
              {group}
              <span style={{ flex: 1 }} />
              {groupExpanded[group] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {groupExpanded[group] && (
              <div style={{ marginTop: 6 }}>
                {tools.map((tool, i) => {
                  const fn = tool.function || tool;
                  const name = fn.name;
                  const hasParams = !!(fn.parameters?.properties && Object.keys(fn.parameters.properties).length);
                  return (
                    <div
                      key={name}
                      style={{
                        background: expanded[`${group}_${i}`] ? "#f8fafc" : "#fff",
                        border: "1px solid #e4e7ec",
                        borderRadius: 8,
                        marginBottom: 7,
                        boxShadow: expanded[`${group}_${i}`] ? "0 2px 12px #c7cbe615" : "none",
                        padding: "10px 18px",
                        display: "flex",
                        flexDirection: "column",
                        transition: "background .13s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Terminal size={16} color="#6366f1" style={{ marginRight: 8 }} />
                        <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{name.split("__")[1] || name}</span>
                        <span style={{ color: "#888", fontSize: 13, flex: 2, marginLeft: 10 }}>
                          {fn.description?.split(".")[0]}
                        </span>
                        {hasParams && (
                          <button
                            onClick={() => handleExpand(group, i)}
                            style={{
                              marginLeft: 16,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer"
                            }}
                            title="Detayları göster/gizle"
                          >
                            {expanded[`${group}_${i}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        )}
                        <button
                          onClick={() => runTool(tool)}
                          disabled={running[name]}
                          style={{
                            marginLeft: 10,
                            background: "#6366f1",
                            color: "#fff",
                            border: "none",
                            padding: "4px 13px",
                            borderRadius: 7,
                            cursor: running[name] ? "not-allowed" : "pointer",
                            fontWeight: 500,
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <Play size={13} />
                          {running[name] ? "Çalışıyor..." : "Çalıştır"}
                        </button>
                      </div>
                      {expanded[`${group}_${i}`] && (
                        <>
                          <ParameterRow
                            parameters={fn.parameters}
                            values={paramValues[name] || {}}
                            onChange={(key, value) => onParamChange(name, key, value)}
                          />
                          <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
                            <span><strong>Açıklama:</strong> {fn.description}</span>
                          </div>
                        </>
                      )}
                      {runResult[name] && (
                        <div style={{
                          marginTop: 7,
                          background: "#f1f3fa",
                          borderRadius: 6,
                          padding: "8px 11px",
                          color: runResult[name].error ? "#e11d48" : "#222",
                          fontSize: 14
                        }}>
                          {runResult[name].error
                            ? "Hata: " + runResult[name].error
                            : (Array.isArray(runResult[name].output)
                              ? runResult[name].output.map((err, idx) => (
                                <div key={idx} style={{ color: "#e11d48" }}>{err.message}</div>
                              ))
                              : <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                  {typeof runResult[name].output === "object"
                                    ? JSON.stringify(runResult[name].output, null, 2)
                                    : String(runResult[name].output)}
                                </pre>
                              )
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
