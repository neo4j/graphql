/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { LogicalOperators } from "./Filter";
import { Filter } from "./Filter";

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
                const andPredicate = Cypher.and(...predicates);
                if (!andPredicate) return undefined;
                return Cypher.not(andPredicate);
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
