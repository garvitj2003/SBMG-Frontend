/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'ipad': '768px',      // iPad portrait
        'ipad-lg': '1024px',  // iPad landscape / iPad Pro portrait
        'ipad-pro': '1366px', // iPad Pro landscape
      },
    },
  },
  plugins: [],
}
