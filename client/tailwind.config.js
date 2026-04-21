/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["'IBM Plex Sans'", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};
