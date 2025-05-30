// src/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const defaultSettings = {
  defaultModel: "",
  bubbleFontScale: 1,
  enterToSend: true,
  darkMode: false,
  showImagePreview: true,
  showCodeLineNumbers: false,
  codeWrap: false,
};

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children, models = [] }) {
  const [settings, setSettings] = useState(() => {
    let stored = {};
    try {
      Object.keys(defaultSettings).forEach(k => {
        if (localStorage.getItem(k) !== null) {
          if (typeof defaultSettings[k] === "boolean")
            stored[k] = localStorage.getItem(k) === "true";
          else if (typeof defaultSettings[k] === "number")
            stored[k] = Number(localStorage.getItem(k));
          else
            stored[k] = localStorage.getItem(k);
        }
      });
    } catch (e) {}
    return { ...defaultSettings, ...stored };
  });

  function updateSettings(newSettings) {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      Object.keys(newSettings).forEach(k => {
        localStorage.setItem(k, newSettings[k]);
      });
      return updated;
    });
  }

  useEffect(() => {
    if (models.length > 0 && !models.some(m => m.value === settings.defaultModel)) {
      updateSettings({ defaultModel: models[0].value });
    }
    // eslint-disable-next-line
  }, [models]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
