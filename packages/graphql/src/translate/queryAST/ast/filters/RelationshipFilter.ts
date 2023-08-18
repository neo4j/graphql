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
import type { RelationshipWhereOperator } from "../../../where/types";
import { Filter } from "./Filter";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { QueryASTContext } from "../QueryASTContext";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export class RelationshipFilter extends Filter {
    protected targetNodeFilters: Filter[] = [];
    protected relationship: RelationshipAdapter;
    protected operator: RelationshipWhereOperator;
    protected isNot: boolean;

    constructor({
        relationship,
        operator,
        isNot,
    }: {
        relationship: RelationshipAdapter;
        operator: RelationshipWhereOperator;
        isNot: boolean;
    }) {
        super();
        this.relationship = relationship;
        this.isNot = isNot;
        this.operator = operator;
    }

    public addTargetNodeFilter(...filter: Filter[]): void {
        this.targetNodeFilters.push(...filter);
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        //TODO: not concrete entities
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const relatedNode = new Cypher.Node({
            labels: relatedEntity.labels,
        });
        const relVar = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const nestedContext = new QueryASTContext({
            target: relatedNode,
            relationship: relVar,
            source: queryASTContext.target,
        });

        const pattern = new Cypher.Pattern(nestedContext.source as Cypher.Node)
            .withoutLabels()
            .related(nestedContext.relationship)
            .withDirection(this.relationship.getCypherDirection())
            .withoutVariable()
            .to(nestedContext.target);

        const predicate = this.createRelationshipOperation(pattern, nestedContext);
        if (!predicate) return undefined;
        return this.wrapInNotIfNeeded(predicate);
    }

    private createRelationshipOperation(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Predicate | undefined {
        const predicates = this.targetNodeFilters.map((c) => c.getPredicate(queryASTContext));
        const innerPredicate = Cypher.and(...predicates);

        switch (this.operator) {
            case "ALL": {
                if (!innerPredicate) return undefined;
                const match = new Cypher.Match(pattern).where(innerPredicate);
                const negativeMatch = new Cypher.Match(pattern).where(Cypher.not(innerPredicate));
                // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
                return Cypher.and(new Cypher.Exists(match), Cypher.not(new Cypher.Exists(negativeMatch)));
            }
            case "SINGLE": {
                if (!innerPredicate) return undefined;
                const patternComprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1)).where(
                    innerPredicate
                );
                return Cypher.single(queryASTContext.target, patternComprehension, new Cypher.Literal(true));
                // const isArray = relationField.typeMeta.array;
                // const isRequired = relationField.typeMeta.required;

                // if (isArray || !isRequired) {
                //     const patternComprehension = new Cypher.PatternComprehension(
                //         matchPattern,
                //         new Cypher.Literal(1)
                //     ).where(innerOperation);
                //     return { predicate: Cypher.single(childNode, patternComprehension, new Cypher.Literal(true)) };
                // }

                // const matchStatement = new Cypher.Match(matchPattern);
                // return {
                //     predicate: innerOperation,
                //     preComputedSubqueries: Cypher.concat(matchStatement),
                // };
            }
            default: {
                const match = new Cypher.Match(pattern);
                if (innerPredicate) {
                    return new Cypher.Exists(match.where(innerPredicate));
                }
                return new Cypher.Exists(match);
            }
        }
    }

    protected wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
