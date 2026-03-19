/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";

/** A property which comparison has already been parsed into a Param */
export class ScoreFilter extends Filter {
    private scoreVariable: Cypher.Variable;
    private min?: number;
    private max?: number;

    constructor({ scoreVariable, min, max }: { scoreVariable: Cypher.Variable; min?: number; max?: number }) {
        super();
        this.scoreVariable = scoreVariable;
        this.min = min;
        this.max = max;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const predicates: Cypher.Predicate[] = [];

        if (this.max || this.max === 0) {
            const maxPredicate = Cypher.lte(this.scoreVariable, new Cypher.Param(this.max));
            predicates.push(maxPredicate);
        }
        if (this.min || this.min === 0) {
            const minPredicate = Cypher.gte(this.scoreVariable, new Cypher.Param(this.min));
            predicates.push(minPredicate);
        }

        return Cypher.and(...predicates);
    }
}
