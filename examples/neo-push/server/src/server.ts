import express from "express";
import * as path from "path";
import * as config from "./config";
import createDebug from "./debugger";
import { getServer } from "./gql";

export async function start(): Promise<void> {
    const app = express();

    const debug = createDebug("HTTP");

    if (config.NODE_ENV === "production") {
        debug("Production serving statics");

        app.use("/", express.static(path.join(__dirname, "../../dist")));

        app.use("/index.html", (_req, res) => {
            res.sendFile(path.join(__dirname, "../../dist/index.html"));
        });
    }

    const server = await getServer();

    await server.start();

    server.applyMiddleware({ app });

    debug(`Starting on PORT ${config.HTTP_PORT}`);
}
