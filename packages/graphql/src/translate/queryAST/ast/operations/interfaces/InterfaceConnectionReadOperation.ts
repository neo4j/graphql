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
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import { Operation } from "../operations";

import type { QueryASTNode } from "../../QueryASTNode";
import type { InterfaceConnectionPartial } from "./InterfaceConnectionPartial";

export class InterfaceConnectionReadOperation extends Operation {
    private children: InterfaceConnectionPartial[];

    constructor(children: InterfaceConnectionPartial[]) {
        super();
        this.children = children;
    }

    transpile(options: OperationTranspileOptions): OperationTranspileResult {
        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const nestedSubqueries = this.children.flatMap((c) => {
            const result = c.transpile({
                parentNode: options.parentNode,
                returnVariable: edgeVar,
            });
            // const callSubqueries = result.clauses.map((sq) => new Cypher.Call(sq));
            const parentNode = options.parentNode;

            let clauses = result.clauses;
            if (parentNode) {
                clauses = clauses.map((sq) => Cypher.concat(new Cypher.With(parentNode), sq));
            }
            return clauses;
        });

        const union = new Cypher.Union(...nestedSubqueries);
        const nestedSubquery = new Cypher.Call(union);

        nestedSubquery
            .with([Cypher.collect(edgeVar), edgesVar])
            .with(edgesVar, [Cypher.size(edgesVar), totalCount])
            .return([
                new Cypher.Map({
                    edges: edgesVar,
                    totalCount: totalCount,
                }),
                options.returnVariable,
            ]);

        // .with([Cypher.collect(edgeVar), edgesVar])
        // .with(edgesVar, [Cypher.size(edgesVar), totalCount]);

        // const returnClause = new Cypher.Return([
        //     new Cypher.Map({
        //         edges: edgesVar,
        //         totalCount: totalCount,
        //     }),
        //     options.returnVariable,
        // ]);

        return { clauses: [nestedSubquery], projectionExpr: options.returnVariable };
    }
    public getChildren(): QueryASTNode[] {
        return this.children;
    }
}
