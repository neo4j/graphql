module.exports = {
    content: ["./src/**/*.{html,ts,tsx}"],
    theme: {
        extend: {
            height: {
                "content-container": "calc(100vh - 9rem)",
                "content-docs-container": "calc(100vh - 9rem - 10px)",
            },
            width: {
                "content-container": "calc(100% - 24rem)",
                "editor-container": "calc(100% - (24rem + 24rem))",
            },
            colors: {
                draculaDark: "#282A36",
                contentBlue: "#F6F7FA",
            },
        },
    },
    plugins: [],
    // Be sure to disable preflight,
    // as we provide our own Preflight (CSS Reset)
    // with Needle out of the box
    corePlugins: {
        preflight: false,
    },
};
