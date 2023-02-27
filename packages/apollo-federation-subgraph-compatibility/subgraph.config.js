// simple PM2 subgraph config that starts Node application
module.exports = {
    apps: [
        {
            name: "subgraph",
            script: "dist/bundle.js"
        }
    ]
};
