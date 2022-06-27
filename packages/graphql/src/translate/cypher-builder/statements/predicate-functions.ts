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

import { Query, Relationship } from "../CypherBuilder";
import { CypherContext } from "../CypherContext";
import { MatchPattern } from "../MatchPattern";

export abstract class PredicateFunction {
    public abstract getCypher(context: CypherContext): string;
}

export class ExistsPredicate extends PredicateFunction {
    private matchPattern: MatchPattern<Relationship>;

    constructor(target: Relationship) {
        super();
        this.matchPattern = new MatchPattern(target, {
            source: { labels: false },
            relationship: { variable: false },
            target: { variable: false },
        });
    }

    getCypher(context: CypherContext): string {
        const targetCypher = this.matchPattern.getCypher(context);
        return `exists(${targetCypher})`;
    }
}

export class AnyPredicate extends PredicateFunction {
    private matchPattern: MatchPattern<Relationship>;
    private targetRelationship: Relationship;

    private innerStatement: Query | undefined;

    constructor(target: Relationship, query?: Query) {
        super();
        this.targetRelationship = target;
        this.matchPattern = new MatchPattern(target, {
            source: { labels: false },
            relationship: { variable: false },
            target: { variable: true },
        });
        this.innerStatement = query;
    }

    getCypher(context: CypherContext): string {
        const matchPatternCypher = this.matchPattern.getCypher(context);
        const relationshipTargetVariable = context.getVariableId(this.targetRelationship.target);

        let innerQuery = "";
        if (this.innerStatement) {
            innerQuery = this.innerStatement.getCypher(context); // TODO: this is a hack, should be part of AST
        }

        return `any(${relationshipTargetVariable} IN [${matchPatternCypher} | ${relationshipTargetVariable}]
            ${innerQuery})`;
    }
}

export function exists(target: Relationship): ExistsPredicate {
    return new ExistsPredicate(target);
}

export function any(target: Relationship, query?: Query): AnyPredicate {
    return new AnyPredicate(target, query);
}
