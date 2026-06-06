import { contextBridge, ipcRenderer } from "electron";

// The ONLY surface exposed to the renderer (constraint: secure-electron). The backend port is
// passed as a launch argument by main.ts; the renderer reads it via window.app.backendBaseUrl.
const portArg = process.argv.find((a) => a.startsWith("--pos-port="));
const port = portArg ? portArg.split("=")[1] : "8787";

contextBridge.exposeInMainWorld("app", {
  backendBaseUrl: `http://127.0.0.1:${port}`,
  printDoc: (html: string): Promise<void> => ipcRenderer.invoke("print-doc", html),
  savePdf: (html: string): Promise<string | null> => ipcRenderer.invoke("save-pdf", html),
});
