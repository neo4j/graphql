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
import { QueryASTNode } from "../QueryASTNode";
import type { Filter, LogicalOperators } from "./Filter";

export class LogicalFilter extends QueryASTNode {
    private operation: LogicalOperators;
    protected children: Filter[];

    constructor({ operation, filters }: { operation: LogicalOperators; filters: Filter[] }) {
        super();
        this.operation = operation;
        this.children = filters;
    }

    // VisitPredicate
    public getPredicate(node: Cypher.Node | Cypher.Relationship | any): Cypher.Predicate | undefined {
        const predicates = filterTruthy(this.children.map((f) => f.getPredicate(node))); // TODO: fix relationship vs node predicates

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
        }
    }
}
