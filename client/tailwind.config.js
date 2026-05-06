/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1A4FA0",
          accent: "#2E7FD9",
          cta: "#F0A500",
          surface: "#EAF3FC",
          background: "#F7F8FA",
          ink: "#1C1E2B"
        },
        sidebar: {
          DEFAULT: "#1C1E2B",
          hover: "#262A3D",
          active: "#2E7FD9",
          muted: "#8A8FA3"
        }
      },
      fontFamily: {
        display: ["'Inter'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 12px 40px rgba(28, 30, 43, 0.08)",
        card: "0 1px 3px rgba(28, 30, 43, 0.06), 0 1px 2px rgba(28, 30, 43, 0.04)",
        cardHover: "0 8px 24px rgba(28, 30, 43, 0.10)"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-800px 0" },
          "100%": { backgroundPosition: "800px 0" }
        }
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out both",
        slideUp: "slideUp 0.5s ease-out both",
        shimmer: "shimmer 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
