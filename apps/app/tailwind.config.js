/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0A0A0A",
          card: "#171717",
          accent: "#10B981", // Emerald 500
          muted: "#A3A3A3",
          border: "#262626",
          surface: "#262626",
        },
      },
    },
  },
  plugins: [],
};
