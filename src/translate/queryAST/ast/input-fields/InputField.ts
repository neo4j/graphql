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
import type { QueryASTContext } from "../QueryASTContext";
import { QueryASTNode } from "../QueryASTNode";

export abstract class InputField extends QueryASTNode {
    public name: string;
    public attachedTo: "node" | "relationship";

    constructor(name: string, attachedTo: "node" | "relationship" = "node") {
        super();
        this.name = name;
        this.attachedTo = attachedTo;
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    protected getTarget(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Node | Cypher.Relationship {
        const target = this.attachedTo === "node" ? queryASTContext.target : queryASTContext.relationship;
        if (!target) {
            throw new Error("No target found");
        }
        return target;
    }

    abstract getSetParams(_queryASTContext: QueryASTContext, inputVariable?: Cypher.Variable): Cypher.SetParam[];
}
