// toolsRegistry.js
export const uiTools = [
  {
    name: "scriptpanel__save_script",
    description: "A tool for saving a script.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "The code to save" }
      },
      required: ["code"]
    }
  },
  // başka tool'lar...
];
