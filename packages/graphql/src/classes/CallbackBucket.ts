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

import { Context, Neo4jGraphQLCallbacks } from "../types";

export interface Callback {
    functionName: string;
    paramName: string;
    parent?: Record<string, unknown>;
}

export class CallbackBucket {
    public callbacks: Callback[];
    private context: Context;

    constructor(context: Context) {
        this.context = context;
        this.callbacks = [];
    }

    public addCallback(callback: Callback) {
        this.callbacks.push(callback);
    }

    public async resolveCallbacksAndFilterCypher(options: {
        cypher: string;
    }): Promise<{ cypher: string; params: Record<string, unknown> }> {
        const params: Record<string, unknown> = {};
        let cypher = options.cypher;

        await Promise.all(
            this.callbacks.map(async (cb) => {
                const callbackFunction = (this.context?.callbacks as Neo4jGraphQLCallbacks)[cb.functionName] as (
                    args?: Record<string, unknown>
                ) => Promise<any>;
                const param = await callbackFunction(cb.parent);

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
