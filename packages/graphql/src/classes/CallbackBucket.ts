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

import type { Neo4jGraphQLCallbacks } from "../types";
import type { Neo4jGraphQLContext } from "../types/neo4j-graphql-context";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";

export interface Callback {
    functionName: string;
    paramName: string;
    parent?: Record<string, unknown>;
}

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
                }

                params[cb.paramName] = param;
            })
        );

        return { cypher, params };
    }
}
