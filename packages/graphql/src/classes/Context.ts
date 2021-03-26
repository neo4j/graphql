import { IncomingMessage } from "http";
import { Driver } from "neo4j-driver";
import { verifyAndDecodeToken } from "../auth";
import { DriverConfig } from "../types";
import Neo4jGraphQL from "./Neo4jGraphQL";

export interface ContextConstructor {
    neoSchema: Neo4jGraphQL;
    driver: Driver;
    driverConfig?: DriverConfig;
    [k: string]: any;
}

class Context {
    readonly graphQLContext: any;

    readonly neoSchema: Neo4jGraphQL;

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

        const token = authorization.split("Bearer ")[1];

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
