import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#09090b",
        panel: "#111827",
        panelAlt: "#1f2937",
        accent: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        ink: "#e5eef8",
        muted: "#94a3b8",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34, 197, 94, 0.25), 0 20px 50px rgba(15, 23, 42, 0.6)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(148, 163, 184, 0.14) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
