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

import { Query, Relationship, Node } from "../CypherBuilder";
import { CypherContext } from "../CypherContext";
import { MatchPattern } from "../MatchPattern";

export abstract class PredicateFunction {
    public abstract getCypher(context: CypherContext): string;
}

export class ExistsPredicate extends PredicateFunction {
    private matchPattern: MatchPattern<Relationship>;

    constructor(target: MatchPattern<Relationship>) {
        super();
        this.matchPattern = target;
        // this.matchPattern = new MatchPattern(target, {
        //     source: { labels: false },
        //     relationship: { variable: false },
        //     target: { variable: false },
        // });
    }

    getCypher(context: CypherContext): string {
        const targetCypher = this.matchPattern.getCypher(context);
        return `exists(${targetCypher})`;
    }
}

type ListPredicateName = "ANY" | "NONE" | "ALL" | "SINGLE";

export class ListPredicate extends PredicateFunction {
    private matchPattern: MatchPattern<Relationship>;
    private matchTarget: Node;

    private innerStatement: Query | undefined;

    private predicate: ListPredicateName;

    constructor(predicate: ListPredicateName, pattern: MatchPattern<Relationship>, target: Node, query?: Query) {
        super();
        this.matchPattern = pattern;
        this.matchTarget = target;

        this.innerStatement = query;
        this.predicate = predicate;
    }

    getCypher(context: CypherContext): string {
        const matchPatternCypher = this.matchPattern.getCypher(context);
        const relationshipTargetVariable = context.getVariableId(this.matchTarget);

        let innerQuery = "";
        if (this.innerStatement) {
            innerQuery = this.innerStatement.getCypher(context); // TODO: this is a hack, should be part of AST
        }

        return `${this.predicate}(${relationshipTargetVariable} IN [${matchPatternCypher} | ${relationshipTargetVariable}]
            ${innerQuery})`;
    }
}

export function exists(pattern: MatchPattern<Relationship>): ExistsPredicate {
    return new ExistsPredicate(pattern);
}

export function any(pattern: MatchPattern<Relationship>, target: Node, query?: Query): ListPredicate {
    return new ListPredicate("ANY", pattern, target, query);
}

export function none(pattern: MatchPattern<Relationship>, target: Node, query?: Query): ListPredicate {
    return new ListPredicate("NONE", pattern, target, query);
}

export function single(pattern: MatchPattern<Relationship>, target: Node, query?: Query): ListPredicate {
    return new ListPredicate("SINGLE", pattern, target, query);
}

export function all(pattern: MatchPattern<Relationship>, target: Node, query?: Query): ListPredicate {
    return new ListPredicate("ALL", pattern, target, query);
}
