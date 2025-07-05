// src/MarkdownMessage.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import "highlight.js/styles/github-dark.css";

// Markdown içinden görsel linkleri ayıkla (hem ![desc](url), hem [desc](url.jpg), hem düz jpg/png/gif)
function extractImageLinks(markdown) {
  const regex = /\[([^\]]*)\]\(([^)]+?\.(?:jpg|jpeg|png|gif|webp))\)/gi;
  let match, urls = [];
  while ((match = regex.exec(markdown)) !== null) {
    urls.push(match[2]);
  }
  const urlRegex = /https?:\/\/[^\s)]+?\.(jpg|jpeg|png|gif|webp)/gi;
  let plainMatch;
  while ((plainMatch = urlRegex.exec(markdown)) !== null) {
    urls.push(plainMatch[0]);
  }
  return [...new Set(urls)];
}

// Düz metinde linkleri otomatik tıklanabilir yap
function autoLinkify(text) {
  if (typeof text !== "string") return text;
  return text.split(/((?:https?:\/\/|www\.)\S+)/g).map((part, i) => {
    if (/^(https?:\/\/|www\.)\S+/.test(part)) {
      let url = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
           style={{ color: "#60a5fa", textDecoration: "underline" }}>
          {part}
        </a>
      );
    }
    return part;
  });
}
function extractText(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  // React element ise children’ına git
  if (node.props && node.props.children) return extractText(node.props.children);
  return "";
}
export default function MarkdownMessage({
  content,
  showImagePreview = false,
  codeLineNumbers,
  codeWrap,
  fontSize // px string, örn: "17px"
}) {
  // Görsel linklerini ayıkla
  const imageLinks = showImagePreview ? extractImageLinks(content || "") : [];

  // Kod bloklarında satır numarası istiyor mu? (highlight.js ile, css üzerinden destekler)
  // Satır kaydırma istiyor mu? (codeWrap)

  // Eğer tamamen düz metinse ve markdown değilse
  if (
    typeof content === "string" &&
    !content.includes("[") &&
    !content.includes("`")
  ) {
    return (
      <div style={{ whiteSpace: "pre-wrap", fontSize, lineHeight: 1.7 }}>
        {autoLinkify(content)}
        {showImagePreview && imageLinks.length > 0 &&
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {imageLinks.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block" }}>
                <img
                  src={url}
                  alt={`Görsel Önizleme ${idx + 1}`}
                  style={{
                    width: 74, height: 74,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #222",
                    boxShadow: "0 2px 6px #0003"
                  }}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        }
      </div>
    );
  }

  return (
    <div style={{ fontSize }}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
 components={{
  img: () => null, // img etiketlerini gizle
  
code({ inline, className, node, children, ...props }) {
  // 1️⃣  ham kodu mümkünse node’dan al
  const codeStr =
    (node && node.children && node.children[0] && node.children[0].value)
      ? node.children[0].value
      : extractText(children);          // 🔸 artık “[object Object]” gelmez

  // 🔹 INLINE -----------------------------------------------
  if (inline) {
    return (
      <code
        style={{
          background: "#2a2d34",
          color: "#f0c674",
          borderRadius: 4,
          padding: "2px 6px",
          fontFamily: "Fira Mono, Menlo, monospace",
          fontSize: fontSize ? parseInt(fontSize) - 1 : 14
        }}
        {...props}
      >
        {codeStr}
      </code>
    );
  }

  // 🔹 MULTILINE --------------------------------------------
  return (
    <pre
      style={{
        borderRadius: 8,
        padding: "14px 16px",
        margin: "8px 0",
        fontSize: fontSize ? parseInt(fontSize) - 1 : 15,
        fontFamily: "Fira Mono, Menlo, monospace",
        overflowX: codeWrap ? "auto" : "visible",
        lineHeight: 1.6,
        background: "#22242a",
        position: "relative"
      }}
    >
      <button
        onClick={() => {
          navigator.clipboard.writeText(codeStr);
          toast.success("Kod panoya kopyalandı!");
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          background: "rgba(24,24,27,0.85)",
          border: "none",
          borderRadius: 7,
          color: "#fafafa",
          cursor: "pointer",
          zIndex: 2,
          padding: 4,
          boxShadow: "0 2px 8px #0002",
          opacity: 0.75
        }}
        title="Kodu panoya kopyala"
        tabIndex={-1}
      >
        <Copy size={16} />
      </button>
      <code className={className} {...props}>
        {codeStr}
      </code>
    </pre>
  );
},
          a({ ...props }) {
            return (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#60a5fa", textDecoration: "underline" }}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
      {showImagePreview && imageLinks.length > 0 &&
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {imageLinks.map((url, idx) => (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block" }}>
              <img
                src={url}
                alt={`Görsel Önizleme ${idx + 1}`}
                style={{
                  width: 74, height: 74,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #222",
                  boxShadow: "0 2px 6px #0003"
                }}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      }
    </div>
  );
}
