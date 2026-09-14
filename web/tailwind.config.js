/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nalco: {
          navy: "#0b2545",
          blue: "#13315c",
          orange: "#f5a623",
          amber: "#ffb703",
        },
      },
    },
  },
  plugins: [],
};
