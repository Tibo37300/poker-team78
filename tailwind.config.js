/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: '#1a6b3c',
          darkgreen: '#0f3d22',
          gold: '#f0c040',
          darkgold: '#b8922e',
          felt: '#1e5631',
        }
      }
    },
  },
  plugins: [],
}

