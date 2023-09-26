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
import { QueryASTNode } from "../QueryASTNode";
import type { QueryASTContext } from "../QueryASTContext";

export abstract class Field extends QueryASTNode {
    public alias: string;
    public attachedTo: "node" | "relationship";

    constructor({ alias, attachedTo = "node" }: { alias: string; attachedTo?: "node" | "relationship" }) {
        super();
        this.alias = alias;
        this.attachedTo = attachedTo;
    }

    // TODO: this is a duplicate logic from property filters
    protected getVariableRef(queryASTContext: QueryASTContext): Cypher.Variable {
        if (this.attachedTo === "node") {
            return queryASTContext.target;
        } else if (this.attachedTo === "relationship" && queryASTContext.relationship) {
            return queryASTContext.relationship;
        } else {
            throw new Error("Transpilation error");
        }
    }


    // the optional variable is a temporary hack used for the projection field of the aggregation field.
    public abstract getProjectionField(
        queryASTContext: QueryASTContext,
        variable?: Cypher.Variable
    ): string | Record<string, Cypher.Expr>;

    public print(): string {
        return `${super.print()} <${this.alias}>`;
    }
}
