// src/App.jsx
import { LogProvider } from "./LogContext";
import React from "react";
import { Theme } from "@radix-ui/themes";
import MainLayout from "./MainLayout";
import { SettingsProvider } from "./SettingsContext";
import { BridgeWebSocketProvider } from "./BridgeWebSocketContext";
import { ToolProvider } from "./ToolContext";
import { ToolCallProvider } from "./ToolCallContext";

export default function App() {
  return (
    <LogProvider>
      <Theme accentColor="indigo" radius="large">
        <SettingsProvider>
          <BridgeWebSocketProvider>
            <ToolProvider>
              <ToolCallProvider>
                <MainLayout />
              </ToolCallProvider>
            </ToolProvider>
          </BridgeWebSocketProvider>
        </SettingsProvider>

      </Theme>
    </LogProvider>
    
  );
}