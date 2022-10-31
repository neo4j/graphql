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

export type GraphQLCreateInput = Record<string, any>;

export interface TreeDescriptor {
    properties: Set<string>;
    children: Record<string, TreeDescriptor>;
    path: string;
}

export class UnsupportedUnwindOptimization extends Error {
    readonly name;

    constructor(message: string) {
        super(message);

        // if no name provided, use the default. defineProperty ensures that it stays non-enumerable
        if (!this.name) {
            Object.defineProperty(this, "name", { value: "UnsupportedUnwindOptimization" });
        }
    }
}
