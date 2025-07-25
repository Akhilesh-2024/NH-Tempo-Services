module.exports = {
  darkMode: "class", // Enables dark mode with a "dark" class
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb", // Blue-600
        secondary: "#9333ea", // Purple-600
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
