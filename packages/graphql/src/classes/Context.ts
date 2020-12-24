import { IncomingMessage } from "http";
import { Driver } from "neo4j-driver";
import { verifyAndDecodeToken } from "../auth";
import NeoSchema from "./NeoSchema";

export interface ContextConstructor {
    graphQLContext: any;
    neoSchema: NeoSchema;
    driver: Driver;
}

class Context {
    readonly graphQLContext: any;

    readonly neoSchema: NeoSchema;

    readonly driver: Driver;

    jwt: any;

    constructor(input: ContextConstructor) {
        this.graphQLContext = input.graphQLContext;
        this.neoSchema = input.neoSchema;
        this.driver = input.driver;
    }

    getJWT(): any {
        if (this.jwt) {
            return this.jwt;
        }

        const req =
            this.graphQLContext instanceof IncomingMessage
                ? this.graphQLContext
                : this.graphQLContext.req || this.graphQLContext.request;

        if (
            !req ||
            !req.headers ||
            (!req.headers.authorization && !req.headers.Authorization) ||
            (!req && !req.cookies && !req.cookies.token)
        ) {
            return false;
        }

        const authorization = req.headers.authorization || req.headers.Authorization || req.cookies.token || "";

        const [_, token] = authorization.split("Bearer ");

        if (!token) {
            return false;
        }

        const jwt = verifyAndDecodeToken(token);

        this.jwt = jwt;

        return jwt;
    }

    getJWTSafe(): any {
        let jwt = {};

        try {
            jwt = this.getJWT() || {};
        } catch (error) {
            return {};
        }

        return jwt;
    }
}

export default Context;
