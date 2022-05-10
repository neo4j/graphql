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

import { escapeLabel } from "../utils";
import { Node } from "./Node";
import { CypherVariable } from "./References";

export type RelationshipInput = {
    source: Node;
    target: Node;
    type?: string;
    directed?: boolean;
};

export class Relationship implements CypherVariable {
    public readonly prefix: string = "this";
    public readonly source: Node;
    public readonly target: Node;

    public readonly type?: string;
    public readonly directed: boolean;

    constructor(input: RelationshipInput) {
        this.type = input.type || undefined;
        this.source = input.source;
        this.target = input.target;
        this.directed = input.directed === undefined ? true : input.directed;
    }

    public getTypeString(): string {
        return this.type ? `:${escapeLabel(this.type)}` : "";
    }
}
