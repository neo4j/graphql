import express from "express";
import rateLimit from "express-rate-limit";
import * as path from "path";
import * as config from "./config";
import createDebug from "./debugger";
import { getServer } from "./gql";

export async function start(): Promise<void> {
    const app = express();

    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 20, // Limit each IP to 20 requests per `window` (here, per 1 minute)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    });

    const debug = createDebug("HTTP");

    if (config.NODE_ENV === "production") {
        debug("Production serving statics");

        // Apply the rate limiting middleware to all requests
        app.use(limiter);

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
