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
import type { QueryASTVisitor } from "../../visitors/QueryASTVIsitor";
import type { CypherTreeSelection } from "../../../cypher-tree/Selection";

export abstract class Field extends QueryASTNode {
    public alias: string;

    constructor(alias: string) {
        super();
        this.alias = alias;
    }

    public abstract getProjectionField(variable: Cypher.Variable): string | Record<string, Cypher.Expr>;
    public compileToCypher({ tree, target }: { tree: CypherTreeSelection; target: Cypher.Variable }): void {}

    public getSubquery(_node: Cypher.Node): Cypher.Clause[] | Cypher.Clause | undefined {
        return undefined;
    }

    public accept(v: QueryASTVisitor) {
        return v.visitField(this);
    }
}
