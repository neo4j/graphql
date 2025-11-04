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
import { filterTruthy } from "../../../../utils/utils";
import type { LogicalOperators } from "./Filter";
import { Filter } from "./Filter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";

export class LogicalFilter extends Filter {
    private operation: LogicalOperators;
    public children: Filter[];

    constructor({ operation, filters }: { operation: LogicalOperators; filters: Filter[] }) {
        super();
        this.operation = operation;
        this.children = filters;
    }

    public getChildren(): QueryASTNode[] {
        return [...this.children];
    }

    public print(): string {
        return `${super.print()} <${this.operation}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.children.flatMap((c) => c.getSubqueries(context));
    }

    public getSelection(context: QueryASTContext): Array<Cypher.Match | Cypher.With> {
        return this.getChildren().flatMap((c) => c.getSelection(context));
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const predicates = filterTruthy(this.children.map((f) => f.getPredicate(queryASTContext)));

        switch (this.operation) {
            case "NOT": {
                if (predicates.length === 0) return undefined;
                return Cypher.not(Cypher.and(...predicates));
            }
            case "AND": {
                return Cypher.and(...predicates);
            }
            case "OR": {
                return Cypher.or(...predicates);
            }
            case "XOR": {
                return Cypher.xor(...predicates);
            }
        }
    }
}
