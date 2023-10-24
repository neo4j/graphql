module.exports = {
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
            },
        },
    },
    presets: [require("@neo4j-ndl/base").tailwindConfig],
    // plugins: [],
    // Be sure to disable preflight,
    // as we provide our own Preflight (CSS Reset)
    // with Needle out of the box
    corePlugins: {
        preflight: false,
    },
    prefix: "",
};
