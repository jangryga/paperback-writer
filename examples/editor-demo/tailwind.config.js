import react from "@vitejs/plugin-react";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{html,js,tsx,ts}"],
  theme: {
    extend: {},
  },
  plugins: [react()],
};
