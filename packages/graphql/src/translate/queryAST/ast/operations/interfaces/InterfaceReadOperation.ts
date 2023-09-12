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

import Cypher from "@neo4j/cypher-builder";
import type { QueryASTNode } from "../../QueryASTNode";
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import { Operation } from "../operations";
import type { InterfaceReadPartial } from "./InterfaceReadPartial";

export class InterfaceReadOperation extends Operation {
    private children: InterfaceReadPartial[];
    // protected sortFields: Array<{ node: Sort[]; edge: Sort[] }> = [];

    constructor(children: InterfaceReadPartial[]) {
        super();

        this.children = children;
    }

    public getChildren(): QueryASTNode[] {
        return this.children;
    }

    public transpile(options: OperationTranspileOptions): OperationTranspileResult {
        const nestedSubqueries = this.children.flatMap((c) => {
            const result = c.transpile({
                parentNode: options.parentNode,
                returnVariable: options.returnVariable,
            });
            // const callSubqueries = result.clauses.map((sq) => new Cypher.Call(sq));
            const parentNode = options.parentNode;

            let clauses = result.clauses;
            if (parentNode) {
                clauses = clauses.map((sq) => Cypher.concat(new Cypher.With("*"), sq));
            }
            return clauses;
        });

        const nestedSubquery = new Cypher.Call(new Cypher.Union(...nestedSubqueries))
            .with(options.returnVariable)
            .return([Cypher.collect(options.returnVariable), options.returnVariable]);

        return {
            projectionExpr: options.returnVariable,
            clauses: [nestedSubquery],
        };
    }
}
