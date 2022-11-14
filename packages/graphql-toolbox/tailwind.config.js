module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      height: {
        "content-container": "calc(100vh - 6rem)",
        "content-container-extended": "calc(100vh - 9rem)",
        "content-docs-container": "calc(100vh - 9rem - 10px)",
        "favorite": "35rem",
      },
      width: {
        "content-container": "calc(100% - 24rem)",
        "editor-container": "calc(100% - (24rem + 24rem))",
        "introspection-prompt": "750px",
        "login": "30rem",
      },
      colors: {
        draculaDark: "#282A36",
        contentBlue: "#F6F7FA",
      },
    },
  },
  plugins: [],
}