/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
