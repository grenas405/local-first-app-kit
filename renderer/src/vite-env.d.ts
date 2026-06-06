/// <reference types="vite/client" />

// Injected at build time by vite.config.ts `define` (constraint: version-in-ui-and-changelog).
declare const __APP_VERSION__: string;

// The minimal, explicit preload bridge (constraint: secure-electron). Undefined in a plain browser.
interface Window {
  app?: {
    backendBaseUrl: string;
    printDoc: (html: string) => Promise<void>;
    savePdf: (html: string) => Promise<string | null>;
  };
}

declare module "*.svg" {
  const src: string;
  export default src;
}
