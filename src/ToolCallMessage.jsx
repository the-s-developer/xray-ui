 
import React, { useState, useEffect } from "react";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Eye } from "lucide-react";

 export function ToolCallWithResult({ call, result }) {
   const [modalOpen, setModalOpen] = useState(false);
 
   // Argüman özeti
   let parsedArgs = call?.function?.arguments;
   try { parsedArgs = typeof parsedArgs === "string" ? JSON.parse(parsedArgs) : parsedArgs; } catch {}
   let argEntries = parsedArgs && typeof parsedArgs === "object" && !Array.isArray(parsedArgs)
     ? Object.entries(parsedArgs)
     : [];
 
   // Yanıt özeti
   let parsedResult = result?.content;
   try { parsedResult = typeof parsedResult === "string" ? JSON.parse(parsedResult) : parsedResult; } catch {}
   let resultEntries = parsedResult && typeof parsedResult === "object" && !Array.isArray(parsedResult)
     ? Object.entries(parsedResult)
     : [];
 
   const argsSummary = argEntries.length === 0
     ? ""
     : argEntries.slice(0, 2).map(([k, v]) =>
         <span key={k}><b>{k}</b>: {String(v).slice(0, 30)}{"  "}</span>
       );
 
   // Yanıt özeti
   const resultSummary = (
     (parsedResult === undefined || parsedResult === null || parsedResult === "" ||
       (typeof parsedResult === "object" && Object.keys(parsedResult).length === 0))
       ? "(yanıt yok)"
       : (
         typeof parsedResult === "object"
           ? resultEntries.slice(0, 2).map(([k, v]) =>
               <span key={k}><b>{k}</b>: {String(v).slice(0, 40)}{"  "}</span>
             )
           : <pre style={{
               whiteSpace: "pre-line", // sadece \n'ları yeni satır yap
               margin: 0,
               background: "none",
               color: "#f9fafb",
               fontFamily: "inherit",
               fontSize: 15,
               padding: 0,
               display: "inline"
             }}>
               {String(parsedResult).slice(0, 200)}{String(parsedResult).length > 200 ? "..." : ""}
             </pre>
       )
   );
 
   return (
     <div
       onClick={() => setModalOpen(true)}
       style={{
         background: "#223135",
         color: "#e6f4ff",
         borderRadius: 18,
         padding: "16px 24px",
         margin: "18px 0",
         fontSize: 16,
         borderLeft: "5px solid #36c6f1",
         boxShadow: "0 1px 10px #0001",
         position: "relative",
         cursor: "pointer",
         userSelect: "none",
       }}
       title="Detay için tıkla"
     >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>🪛 {call?.function?.name}</span>
        <span style={{ color: "#7dd3fc", fontWeight:500, fontSize:13, opacity:0.8 }}>
          <Eye size={17} style={{verticalAlign:"middle",marginRight:2}} />
        </span>
      </div>

       <div style={{ fontSize: 15, color: "#bae6fd", marginBottom: 7, marginTop: 3 }}>
         {argsSummary}
       </div>
       <div style={{
         background: "#1e2a2e",
         borderRadius: 10,
         color: "#f9fafb",
         padding: "10px 18px",
         fontFamily: "inherit",
         fontSize: 15
       }}>
       {resultSummary} {resultEntries.length > 2 && <span>...</span>}
       </div>
       {/* Modal */}
       {modalOpen && (
         <div style={{
           position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
           background: "rgba(24,25,27,0.90)", zIndex: 9999,
           display: "flex", alignItems: "center", justifyContent: "center"
         }}>
           <div style={{ background: "#202024", borderRadius: 12, padding: 32, minWidth: 400, color: "#fff", position: "relative", maxWidth: 900, maxHeight: "90vh", overflow: "auto" }}>
             <button onClick={e => {e.stopPropagation();setModalOpen(false);}}
               style={{ position: "absolute", right: 20, top: 12, background: "none", border: "none", fontSize: 32, color: "#ccc", cursor: "pointer" }}>
               ×
             </button>
             <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: "#a5b4fc" }}>{call?.function?.name}</span></div>
             <pre style={{
               background: "#15181f",
               color: "#cffafe",
               padding: 10,
               borderRadius: 6,
               fontSize: 14,
               whiteSpace: "pre-wrap",
               fontFamily: "Fira Mono, monospace",
               marginBottom: 16
             }}>{JSON.stringify(parsedArgs, null, 2)}</pre>
 
             <div style={{ maxHeight: "55vh", overflow: "auto", background: "#1b1b20", borderRadius: 8, padding: 8 }}>
               {/* Eğer markdown blokları varsa düzgün render et */}
               {typeof parsedResult === "string" && parsedResult.match(/```[\s\S]*?```/g) ? (
                 <ReactMarkdown
                   rehypePlugins={[rehypeHighlight]}
                   components={{
                     pre: ({node, ...props}) =>
                       <pre style={{
                         background: "#15181f",
                         color: "#fff",
                         padding: 10,
                         borderRadius: 6,
                         fontSize: 15,
                         whiteSpace: "pre-wrap",
                         fontFamily: "Fira Mono, monospace",
                         margin: 0
                       }} {...props} />,
                     code: ({node, ...props}) =>
                       <code style={{
                         background: "#23272f",
                         color: "#7dd3fc",
                         borderRadius: 4,
                         padding: "2px 6px",
                         fontFamily: "Fira Mono, monospace",
                         fontSize: 15,
                       }} {...props} />
                   }}
                 >
                   {parsedResult}
                 </ReactMarkdown>
               ) : (
                 <pre style={{
                   background: "none",
                   color: "#fff",
                   padding: 0,
                   borderRadius: 6,
                   fontSize: 15,
                   whiteSpace: "pre-wrap",
                   fontFamily: "Fira Mono, monospace",
                   margin: 0
                 }}>
                   {typeof parsedResult === "string" ? parsedResult : JSON.stringify(parsedResult, null, 2)}
                 </pre>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
 


export function ToolResultSummary({ tool_call_id, content }) {
  const [modalOpen, setModalOpen] = useState(false);
  let parsed = content;
  try { parsed = JSON.parse(content); } catch {}
  let summary = typeof parsed === "object"
    ? Object.entries(parsed).slice(0,2).map(([k, v]) =>
        <span key={k}><b>{k}</b>: {String(v).slice(0,40)}{"  "}</span>)
    : String(parsed).slice(0, 100) + (String(parsed).length > 100 ? "..." : "");

  return (
    <div
      onClick={() => setModalOpen(true)}
      style={{
        background: "#1e272d",
        color: "#d1f3e9",
        borderRadius: 8,
        padding: "6px 10px",
        margin: "8px 0",
        fontSize: 14,
        borderLeft: "4px solid #22d3ee",
        cursor: "pointer",
        position: "relative"
      }}
      title="Detay için tıkla"
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>🎮 <b>Tool yanıtı</b> (id: {tool_call_id})</span>
        <span style={{ color: "#7dd3fc", fontWeight:500, fontSize:13, opacity:0.8 }}>Detay</span>
      </div>
      <div style={{ marginTop: 5, fontSize: 13, opacity: 0.85 }}>
        {summary}
      </div>
      {modalOpen && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(24,25,27,0.88)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#202024", borderRadius: 12, padding: 32, minWidth: 320, color: "#fff", position: "relative" }}>
            <button onClick={e => {e.stopPropagation();setModalOpen(false);}}
              style={{ position: "absolute", right: 20, top: 12, background: "none", border: "none", fontSize: 32, color: "#ccc", cursor: "pointer" }}>
              ×
            </button>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Tool Yanıt Detayı</div>
            <pre style={{ background: "#15181f", color: "#cffafe", padding: 10, borderRadius: 6, fontSize: 14 }}>{JSON.stringify(parsed, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
