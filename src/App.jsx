import { LogProvider } from "./LogContext";
import React from "react";
import { Theme } from "@radix-ui/themes";
import MainLayout from "./MainLayout";
import { SettingsProvider } from "./SettingsContext";
import { ToolProvider } from "./ToolContext";
import { CallProvider } from "./CallContext"; // <-- burası değişti

export default function App() {
  return (
    <LogProvider>
      <Theme accentColor="indigo" radius="large">
        <SettingsProvider>
          <ToolProvider>
            <CallProvider>
              <MainLayout />
            </CallProvider>
          </ToolProvider>
        </SettingsProvider>
      </Theme>
    </LogProvider>
  );
}
