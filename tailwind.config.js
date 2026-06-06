/** @type {import('tailwindcss').Config} */
export default {
  content: ["./renderer/index.html", "./renderer/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand tokens are driven by CSS vars set per-domain (renderer/src/brand.generated.css).
        brand: {
          from: "var(--brand-from)",
          via: "var(--brand-via)",
          to: "var(--brand-to)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
