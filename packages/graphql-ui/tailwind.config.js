module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      height: {
        'content-container': 'calc(100vh - 4rem)',
      },
      colors: {
        sidebargrey: '#4D4A57',
        primarydark: '#2C2933',
        secondarydark: '#535864',
        backgroundLight: '#F6F7FA',
        draculaDark: '#282A36',
      },
    },
  },
  plugins: [],
}