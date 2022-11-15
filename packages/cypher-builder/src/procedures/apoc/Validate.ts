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

import type { ListExpr as List } from "../../expressions/list/ListExpr";
import type { MapExpr as Map } from "../../expressions/map/MapExpr";
import type { CypherEnvironment } from "../../Environment";
import type { Predicate } from "../../types";
import { Literal } from "../../variables/Literal";
import { CypherASTNode } from "../../CypherASTNode";

export class Validate extends CypherASTNode {
    private predicate: Predicate;
    private message: string;
    private params: List | Map | Literal;

    constructor(predicate: Predicate, message: string, params: List | Literal | Map = new Literal([0])) {
        super();
        this.predicate = predicate;
        this.message = message;
        this.params = params;
    }

    public getCypher(env: CypherEnvironment): string {
        const predicateCypher = this.predicate.getCypher(env);
        const paramsCypher = this.params.getCypher(env);
        return `apoc.util.validate(${predicateCypher}, "${this.message}", ${paramsCypher})`;
    }
}
