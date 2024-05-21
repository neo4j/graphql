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

import { GraphQLBoolean, GraphQLError, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString } from "graphql";
import type { DateTime, Duration, Integer, LocalDateTime, LocalTime, Date as Neo4jDate, Time } from "neo4j-driver";
import {
    GraphQLBigInt,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDuration,
    GraphQLLocalDateTime,
    GraphQLLocalTime,
    GraphQLTime,
} from "../graphql/scalars";
import type { Neo4jGraphQLCallbacks, TypeMeta } from "../types";
import type { Neo4jGraphQLContext } from "../types/neo4j-graphql-context";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";

interface Callback {
    functionName: string;
    paramName: string;
    parent?: Record<string, unknown>;
    type: TypeMeta;
}

type CallbackResult =
    | number
    | string
    | boolean
    | Integer
    | DateTime
    | DateTime<Integer>
    | Neo4jDate<number>
    | Neo4jDate<Integer>
    | Time<number>
    | Time<Integer>
    | LocalDateTime
    | LocalTime<number>
    | LocalTime<Integer>
    | Duration<number>
    | Duration<Integer>
    | Array<CallbackResult>;

export class CallbackBucket {
    public callbacks: Callback[];
    private context: Neo4jGraphQLTranslationContext;

    constructor(context: Neo4jGraphQLTranslationContext) {
        this.context = context;
        this.callbacks = [];
    }

    public addCallback(callback: Callback): void {
        this.callbacks.push(callback);
    }

    public async resolveCallbacksAndFilterCypher(options: {
        cypher: string;
    }): Promise<{ cypher: string; params: Record<string, unknown> }> {
        const params: Record<string, unknown> = {};
        let cypher = options.cypher;

        await Promise.all(
            this.callbacks.map(async (cb) => {
                const callbackFunction = (this.context.features.populatedBy?.callbacks as Neo4jGraphQLCallbacks)[
                    cb.functionName
                ] as (
                    parent?: Record<string, unknown>,
                    args?: Record<string, never>,
                    context?: Neo4jGraphQLContext
                ) => Promise<any>;
                const param = await callbackFunction(cb.parent, {}, this.context);

                if (param === undefined) {
                    cypher = cypher
                        .split("\n")
                        .filter((line) => !line.includes(`$resolvedCallbacks.${cb.paramName}`))
                        .join("\n");
                } else if (param === null) {
                    params[cb.paramName] = null;
                } else {
                    params[cb.paramName] = this.parseCallbackResult(param, cb.type);
                }
            })
        );

        return { cypher, params };
    }

    private parseCallbackResult(result: unknown, type: TypeMeta): CallbackResult {
        if (type.array) {
            if (!Array.isArray(result)) {
                throw new GraphQLError("Expected list as callback result but did not.");
            }

            return result.map((r) => this.parseCallbackResult(r, { ...type, array: false }));
        }

        switch (type.name) {
            case "Int":
                return GraphQLInt.parseValue(result);
            case "Float":
                return GraphQLFloat.parseValue(result);
            case "String":
                return GraphQLString.parseValue(result);
            case "Boolean":
                return GraphQLBoolean.parseValue(result);
            case "ID":
                return GraphQLID.parseValue(result);
            case "BigInt":
                return GraphQLBigInt.parseValue(result);
            case "DateTime":
                return GraphQLDateTime.parseValue(result);
            case "Date":
                return GraphQLDate.parseValue(result);
            case "Time":
                return GraphQLTime.parseValue(result);
            case "LocalDateTime":
                return GraphQLLocalDateTime.parseValue(result);
            case "LocalTime":
                return GraphQLLocalTime.parseValue(result);
            case "Duration":
                return GraphQLDuration.parseValue(result);
            default:
                throw new GraphQLError("Callback result received for field of unsupported type.");
        }
    }
}
