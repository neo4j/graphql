module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      height: {
        'content-container': 'calc(100vh - 4rem)',
      },
      colors: {
        draculaDark: '#282A36',
      },
    },
  },
  plugins: [],
}