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
import type { QueryASTNode } from "../QueryASTNode";

export class RelationshipFilter extends Filter {
    protected targetNodeFilters: Filter[] = [];
    protected relationship: RelationshipAdapter;
    protected operator: RelationshipWhereOperator;
    protected isNot: boolean;

    // TODO: remove this, this is not good
    private subqueryPredicate: Cypher.Predicate | undefined;

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

    public getChildren(): QueryASTNode[] {
        return [...this.targetNodeFilters];
    }

    public addTargetNodeFilter(...filter: Filter[]): void {
        this.targetNodeFilters.push(...filter);
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const target = new Cypher.Node({
            labels: relatedEntity.labels,
        });
        const relationship = new Cypher.Relationship({
            type: this.relationship.type,
        });
        const nestedContext = context.push({
            target,
            relationship,
        });

        const subqueries = this.targetNodeFilters.flatMap((f) => f.getSubqueries(nestedContext));
        if (subqueries.length > 0) {
            const pattern = new Cypher.Pattern(context.target)
                .withoutLabels()
                .related(relationship)
                .withoutVariable()
                .withDirection(this.relationship.getCypherDirection())
                .to(target);

            switch (this.operator) {
                case "NONE":
                case "SOME":
                case "SINGLE": {
                    const match = new Cypher.Match(pattern);

                    const returnVar = new Cypher.Variable();
                    const nestedSubqueries = this.targetNodeFilters.flatMap((f) => {
                        return f.getSubqueries(nestedContext).map((sq) => {
                            return new Cypher.Call(sq).innerWith(target);
                        });
                    });

                    const subqueriesFilters = this.targetNodeFilters.map((f) => f.getPredicate(nestedContext));

                    const subqueriesPredicate = Cypher.and(...subqueriesFilters);

                    // NOTE: NONE is SOME + isNot
                    // TODO: move to wrapInNullIfNeeded in getPredicate
                    const comparator = this.isNot ? Cypher.false : Cypher.true;
                    this.subqueryPredicate = Cypher.eq(returnVar, comparator);

                    const withAfterSubqueries = new Cypher.With("*");

                    if (subqueriesPredicate) {
                        withAfterSubqueries.where(subqueriesPredicate);
                    }

                    const returnPredicate = this.getNestedSubqueryFilter(target);

                    withAfterSubqueries.return([returnPredicate, returnVar]);

                    return [Cypher.concat(match, ...nestedSubqueries, withAfterSubqueries)];
                }

                case "ALL": {
                    const { clause: nestedSubqueries, returnVariables: truthyReturn } = this.getSubqueryForAllFilter(
                        pattern,
                        nestedContext,
                        false
                    );

                    const { clause: nestedSubqueries2, returnVariables: falsyReturn } = this.getSubqueryForAllFilter(
                        pattern,
                        nestedContext,
                        true
                    );

                    this.subqueryPredicate = Cypher.and(
                        ...falsyReturn.map((v) => Cypher.eq(v, Cypher.false)),
                        ...truthyReturn.map((v) => Cypher.eq(v, Cypher.true))
                    );

                    return [nestedSubqueries, nestedSubqueries2];
                }
            }
        }
        return [];
    }

    private getSubqueryForAllFilter(
        pattern: Cypher.Pattern,
        context: QueryASTContext,
        notPredicate: boolean
    ): { clause: Cypher.Clause; returnVariables: Cypher.Variable[] } {
        const returnVariables: Cypher.Variable[] = [];
        const match = new Cypher.Match(pattern);

        const subqueries = this.targetNodeFilters.map((f) => {
            const returnVar = new Cypher.Variable();
            returnVariables.push(returnVar);
            const nestedSubqueries = f.getSubqueries(context).map((sq) => {
                return new Cypher.Call(sq).innerWith(context.target);
            });

            let predicate = f.getPredicate(context);
            if (predicate && notPredicate) {
                predicate = Cypher.not(predicate);
            }

            const withClause = new Cypher.With("*");
            if (predicate) {
                withClause.where(predicate);
            }
            withClause.return([Cypher.gt(Cypher.count(context.target), new Cypher.Literal(0)), returnVar]); // THis variable needs to be used in predicate

            return Cypher.concat(...nestedSubqueries, withClause);
        });
        return { clause: Cypher.concat(match, ...subqueries), returnVariables };
    }

    private getNestedSubqueryFilter(target: Cypher.Expr): Cypher.Predicate {
        switch (this.operator) {
            case "NONE":
            case "SOME":
                return Cypher.gt(Cypher.count(target), new Cypher.Literal(0));
            case "SINGLE":
                return Cypher.eq(Cypher.count(target), new Cypher.Literal(1));
            case "ALL":
                throw new Error("Not supported");
        }
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (this.subqueryPredicate) return this.subqueryPredicate;
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

    private getSingleRelationshipOperation({
        pattern,
        queryASTContext,
        innerPredicate,
    }: {
        pattern: Cypher.Pattern;
        queryASTContext: QueryASTContext;
        innerPredicate: Cypher.Predicate;
    }): Cypher.Predicate {
        const patternComprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1)).where(
            innerPredicate
        );
        return Cypher.single(queryASTContext.target, patternComprehension, new Cypher.Literal(true));
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

                return this.getSingleRelationshipOperation({
                    pattern,
                    queryASTContext,
                    innerPredicate,
                });
            }
            case "NONE":
            case "SOME": {
                if (!this.relationship.isList) {
                    if (this.relationship.isNullable) {
                        if (!innerPredicate) return undefined;

                        return this.getSingleRelationshipOperation({
                            pattern,
                            queryASTContext,
                            innerPredicate,
                        });
                    } else {
                        // Optional Match + Count
                    }
                }

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
