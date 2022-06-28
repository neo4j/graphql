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

import { Param } from "../CypherBuilder";
import { CypherContext } from "../CypherContext";
import { convertToCypherParams } from "../utils";
import { Query } from "./Query";

export class RawCypher extends Query {
    private query: string;
    private params: Record<string, Param>;

    constructor(query: string, params: Record<string, any>, parent?: Query) {
        super(parent);
        this.query = query;
        this.params = convertToCypherParams(params);
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        if (childrenCypher) throw new Error("Raw query does not support children");
        Object.entries(this.params).forEach(([key, param]) => {
            context.addNamedParamReference(key, param);
        });
        return this.query;
    }
}

type RawCypherCallback = (c: CypherContext) => [string, Record<string, any>];

export class RawCypherWithCallback extends Query {
    private callback: RawCypherCallback;

    constructor(callback: RawCypherCallback, parent?: Query) {
        super(parent);
        this.callback = callback;
    }

    cypher(context: CypherContext, childrenCypher: string): string {
        if (childrenCypher) throw new Error("Raw query does not support children");
        const [query, params] = this.callback(context);

        const cypherParams = convertToCypherParams(params);

        Object.entries(cypherParams).forEach(([key, param]) => {
            context.addNamedParamReference(key, param);
        });
        return query;
    }
}
