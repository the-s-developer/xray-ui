// src/utils/fetchWithLog.js
import { v4 as uuidv4 } from "uuid";

// Not: useLogContext hook'unu doğrudan burada çağırmak mümkün değil!
// Context'i doğrudan hook ile burada kullanamazsın.
// Bu yüzden, aşağıda olduğu gibi window üstüne log ekleyebilirsin VEYA
// fetchWithLog'a (opsiyonel) bir setLogs fonksiyonu parametresi verebilirsin.
// En pratik çözüm: window.xrayLog eklemesi yapmak.

function logToGlobal(log) {
  if (!window.xrayLogs) window.xrayLogs = [];
  window.xrayLogs.push(log);
  // Otomatik güncelleme için custom event yayabilirsin
  window.dispatchEvent(new CustomEvent("xraylogupdate"));
}
export async function fetchWithLog(url, options = {}) {
  const id = uuidv4();
  const timestamp = new Date().toLocaleString();
  let response, text, status;
  try {
    response = await fetch(url, options);
    status = response.status;
    text = await response.text();

    if (!response.ok) {
      logToGlobal({
        id,
        type: "error",
        message: `HTTP ${response.status} - ${url}`,
        detail: text,
        timestamp,
      });
    }

    const data = safeJson(text);
    return {
        status,
        json: () => Promise.resolve(data),
        data,
      };
  } catch (err) {
    logToGlobal({
      id,
      type: "error",
      message: `Fetch error: ${url}`,
      detail: err.stack || err.message,
      timestamp,
    });
    throw err;
  }
}

function safeJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}
