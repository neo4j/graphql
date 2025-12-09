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

import type Cypher from "@neo4j/cypher-builder";
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
} from "../../../graphql/scalars";
import type { AttributeType } from "../../../schema-model/attribute/AttributeType";
import { ListType } from "../../../schema-model/attribute/AttributeType";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";

interface Callback {
    functionName: string;
    param: Cypher.Param;
    parent?: Record<string, unknown>;
    type: AttributeType;
    operation: "CREATE" | "UPDATE";
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

    /** Executes the callbacks and updates the values of the Cypher parameters attached to these callbacks */
    public async resolveCallbacks(): Promise<void> {
        const callbacksList = this.context.features.populatedBy?.callbacks ?? {};
        await Promise.all(
            this.callbacks.map(async (cb) => {
                const callbackFunction = callbacksList[cb.functionName];
                if (callbackFunction) {
                    const paramValue = await callbackFunction(
                        cb.parent,
                        {},
                        { ...this.context, populatedByOperation: cb.operation }
                    );
                    if (paramValue === undefined) {
                        cb.param.value = undefined;
                    } else if (paramValue === null) {
                        cb.param.value = null;
                    } else {
                        cb.param.value = this.parseCallbackResult(paramValue, cb.type);
                    }
                }
            })
        );
    }

    private parseCallbackResult(result: unknown, type: AttributeType): CallbackResult {
        if (type instanceof ListType) {
            if (!Array.isArray(result)) {
                throw new GraphQLError("Expected list as callback result but did not.");
            }

            return result.map((r) => this.parseCallbackResult(r, type.ofType));
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
