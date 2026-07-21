/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sagard: {
          dark: '#0f172a',
          yellow: '#f5b800',
          'yellow-dark': '#d99e00',
        },
      },
    },
  },
  plugins: [],
}
