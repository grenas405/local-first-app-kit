import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { spawn, ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { writeFileSync } from "node:fs";
import * as path from "node:path";

const isDev = !app.isPackaged;
const POS_DEBUG = process.env.POS_DEBUG === "1";

let backend: ChildProcess | null = null;
let win: BrowserWindow | null = null;

/** Ask the OS for a free ephemeral port on loopback. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = (srv.address() as { port: number }).port;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHealth(port: number, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("backend health check timed out");
}

function startBackend(port: number) {
  const dbPath = path.join(app.getPath("userData"), "pos.db");
  const env = { ...process.env, POS_PORT: String(port), POS_DB_PATH: dbPath };

  if (isDev) {
    // Dev: run the TypeScript backend directly with Deno; keep stdio for logs.
    backend = spawn("deno", ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "backend/server.ts"], {
      env,
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
  } else {
    // Packaged: run the compiled sidecar with NO console window (constraint: windows-sidecar-no-console).
    const exe = process.platform === "win32" ? "app-backend.exe" : "app-backend";
    const exePath = path.join(process.resourcesPath, "backend", exe);
    backend = spawn(exePath, [], { env, stdio: "ignore", windowsHide: true });
  }
  backend.on("exit", (code) => console.log(`[backend] exited ${code}`));
}

async function createWindow() {
  const port = (await freePort());
  startBackend(port);
  await waitForHealth(port);

  win = new BrowserWindow({
    width: 1280,
    height: 820,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: [`--pos-port=${port}`],
    },
  });

  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error(`[did-fail-load] ${code} ${desc} ${url}`); // never let a load failure be silent
  });
  if (POS_DEBUG) win.webContents.openDevTools({ mode: "detach" });

  if (isDev) {
    await win.loadURL(`http://localhost:5173?port=${port}`);
  } else {
    await win.loadFile(path.join(__dirname, "..", "dist-renderer", "index.html"), { query: { port: String(port) } });
  }
}

// ── IPC: OS-only actions (print / save-PDF) ──
async function renderToWindow(html: string): Promise<BrowserWindow> {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  await w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  return w;
}

ipcMain.handle("print-doc", async (_e, html: string) => {
  const w = await renderToWindow(html);
  await new Promise<void>((resolve) => w.webContents.print({ silent: false, printBackground: true }, () => resolve()));
  w.close();
});

ipcMain.handle("save-pdf", async (_e, html: string) => {
  const w = await renderToWindow(html);
  const data = await w.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
  w.close();
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: "receipt.pdf", filters: [{ name: "PDF", extensions: ["pdf"] }] });
  if (canceled || !filePath) return null;
  writeFileSync(filePath, data);
  return filePath;
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("quit", () => backend?.kill());
