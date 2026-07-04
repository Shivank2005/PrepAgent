/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      colors: {
        bg0: "#060609",
        bg1: "#0A0A0F",
        bg2: "#12121A",
        bg3: "#18181f",
        border: "#1E1E2E",
        primary: "#7C3AED",
        primaryGlow: "#A78BFA",
        accent: "#06B6D4",
        accent2: "#4fd9b3",
        accent3: "#ff6b6b",
        textPrimary: "#F8FAFC",
        textMuted: "#94A3B8",
        glow: "rgba(124, 58, 237, 0.4)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 10px rgba(124, 106, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 106, 255, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};
