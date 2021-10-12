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

import * as neo4j from "neo4j-driver";
import { ResolveTree } from "graphql-parse-resolve-info";
import { Neo4jGraphQL } from "../../classes";
import { Context } from "../../types";

// eslint-disable-next-line import/prefer-default-export
export class ContextBuilder {
    private context: Context;

    constructor(newOptions: Partial<Context> = {}) {
        // const driver = neo4j.driver();
        this.context = {
            driver: {} as neo4j.Driver,
            resolveTree: {} as ResolveTree,
            neoSchema: new Neo4jGraphQL({
                typeDefs: "",
            }),
            ...newOptions,
        };
    }

    public with(newOptions: Partial<Context>): ContextBuilder {
        this.context = { ...this.context, ...newOptions };
        return this;
    }

    public instance(): Context {
        return this.context;
    }
}

// export interface Context {
//     driver: Driver;
//     driverConfig?: DriverConfig;
//     resolveTree: ResolveTree;
//     neoSchema: Neo4jGraphQL;
//     jwt?: JwtPayload;
//     auth?: AuthContext;
//     queryOptions?: CypherQueryOptions;
//     [k: string]: any;
// }
