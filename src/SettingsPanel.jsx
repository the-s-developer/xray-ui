// src/SettingsPanel.jsx
import React from "react";
import { useSettings } from "./SettingsContext";

export function SettingsPanel({ }) {
  const { settings, updateSettings } = useSettings();

  function handleResetSettings() {
    [
      "bubbleFontScale",
      "enterToSend",
      "darkMode",
      "showImagePreview",
      "showCodeLineNumbers",
      "codeWrap"
    ].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }

  return (
    <div style={{ padding: 32, color: "#fff", maxWidth: 480 }}>
      <div style={{ margin: "18px 0" }}>
        <label><b>Balon Yazı Boyutu:</b></label><br />
        <input
          type="range"
          min={0.7}
          max={1.8}
          step={0.05}
          value={settings.bubbleFontScale}
          onChange={e => updateSettings({ bubbleFontScale: parseFloat(e.target.value) })}
          style={{ width: 160, marginRight: 10, verticalAlign: "middle" }}
        />
        <span style={{ fontSize: 16 }}>{Math.round(settings.bubbleFontScale * 100)}%</span>
      </div>
      <div style={{ margin: "18px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={settings.enterToSend}
            onChange={e => updateSettings({ enterToSend: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          <b>Enter ile gönder</b>
        </label>
      </div>
      <div style={{ margin: "18px 0" }}>
        <label>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={e => updateSettings({ darkMode: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          <b>Koyu Mod</b>
        </label>
      </div>
      <hr style={{ margin: "24px 0", opacity: 0.2 }} />
      <div style={{ margin: "18px 0" }}>
        <b>Mesaj/Görsel/Kod Balon Ayarları:</b>
        <div style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={settings.showImagePreview}
              onChange={e => updateSettings({ showImagePreview: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            Görselleri önizle (resim linki varsa otomatik göster)
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={settings.showCodeLineNumbers}
              onChange={e => updateSettings({ showCodeLineNumbers: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            Kod bloklarında satır numarası göster
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={settings.codeWrap}
              onChange={e => updateSettings({ codeWrap: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            Kod bloklarında satır kaydırmayı aç
          </label>
        </div>
      </div>
      <button
        onClick={handleResetSettings}
        style={{
          marginTop: 30, background: "#b91c1c", color: "#fff", padding: "12px 20px",
          borderRadius: 12, border: "none", fontWeight: 600, fontSize: 18, cursor: "pointer"
        }}
      >
        Tüm Ayarları Sıfırla
      </button>
    </div>
  );
}
