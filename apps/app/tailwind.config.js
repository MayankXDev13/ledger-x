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
        bg: "#0A0A0A",
        surface: "#171717",
        "surface-raised": "#262626",
        line: "#262626",
        ink: "#FAFAFA",
        "ink-muted": "#A3A3A3",
        positive: "#34D399",
        aging: {
          "0-30": "#737373",
          "31-60": "#FB7185",
          older: "#E11D48",
        },
        danger: "#E11D48",
        "danger-text": "#FB7185",
        brand: {
          dark: "#0A0A0A",
          card: "#171717",
          border: "#262626",
          muted: "#A3A3A3",
          surface: "#262626",
          // Brand and action color. Orange-600 is the identity; orange-700 is
          // the accessible fill behind white button labels.
          primary: "#EA580C",
          "primary-fill": "#C2410C",
          "primary-text": "#FB923C",
          soft: "#FFEDD5",
          accent: "#EA580C",
          avatar: "#262626",
        },
      },
      fontFamily: {
        mukta: ["Mukta_400Regular"],
        "mukta-medium": ["Mukta_500Medium"],
        "mukta-semibold": ["Mukta_600SemiBold"],
        "mukta-bold": ["Mukta_700Bold"],
        "mukta-black": ["Mukta_800ExtraBold"],
        plex: ["IBMPlexMono_500Medium"],
        mono: ["IBMPlexMono_500Medium"],
      },
    },
  },
  plugins: [],
};
