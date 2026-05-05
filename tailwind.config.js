/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        // Brand Color Palette
        "brand-bg": "#F1F5F9", // Primary Background
        "brand-card": "#FFFFFF", // Card/Surface
        "brand-sidebar": "#0F172A", // Sidebar/Primary
        "brand-accent": "#C2A388", // Accent (tan)
        "brand-muted": "#EDE9E6", // Muted Surface

        // Legacy extended colors
        slate: {
          soft: "#f1f5f9",
          muted: "#ede9e6",
        },
        navy: {
          deep: "#0f172a",
        },
        tan: {
          warm: "#c2a388",
        },
      },
      backgroundColor: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
}
