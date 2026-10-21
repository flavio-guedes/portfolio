/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hermeguide: {
          bg: "#0b0f14",
          surface: "#111820",
          border: "#1f2a38",
          muted: "#7a8aa2",
          text: "#e6ecf4",
          blue: "#3b82f6",
          green: "#22c55e",
          yellow: "#eab308",
          red: "#ef4444",
        },
      },
      backgroundImage: {
        glass: "linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))",
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
