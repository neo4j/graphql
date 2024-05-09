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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipWhereOperator } from "../../../where/types";
import { hasTarget } from "../../utils/context-has-target";
import { getEntityLabels } from "../../utils/create-node-from-entity";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { Filter } from "./Filter";

export class ConnectionFilter extends Filter {
    protected innerFilters: Filter[] = [];
    protected relationship: RelationshipAdapter;
    protected target: ConcreteEntityAdapter | InterfaceEntityAdapter; // target can be an interface entity, only with the label predicate optimization
    protected operator: RelationshipWhereOperator;
    protected isNot: boolean;

    // Predicate generation for subqueries cannot be done separately from subqueries, so we need to create the predicates at the same time
    // as subqueries and store them
    protected subqueryPredicate: Cypher.Predicate | undefined;

    constructor({
        relationship,
        target,
        operator,
        isNot,
    }: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        operator: RelationshipWhereOperator | undefined;
        isNot: boolean;
    }) {
        super();
        this.relationship = relationship;
        this.isNot = isNot;
        this.operator = operator || "SOME";
        this.target = target;
    }

    public addFilters(filters: Filter[]): void {
        this.innerFilters.push(...filters);
    }

    public getChildren(): QueryASTNode[] {
        return [...this.innerFilters];
    }

    public print(): string {
        return `${super.print()} [${this.relationship.name}] <${this.operator}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const targetNode = new Cypher.Node();
        const targetLabels = getEntityLabels(this.target, context.neo4jGraphQLContext);
        const relationship = new Cypher.Relationship();

        const pattern = new Cypher.Pattern(context.target)
            .related(relationship, {
                type: this.relationship.type,
                direction: this.relationship.getCypherDirection(),
            })
            .to(targetNode, { labels: targetLabels });

        const nestedContext = context.push({
            relationship,
            target: targetNode,
        });

        switch (this.operator) {
            case "ALL":
                return this.getSubqueriesForOperationAll(pattern, nestedContext);
            default:
                return this.getSubqueriesForDefaultOperations(pattern, nestedContext);
        }
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        if (this.subqueryPredicate) {
            return this.subqueryPredicate;
        }

        const target = new Cypher.Node();
        let targetLabels: string[] = [];
        if (!isInterfaceEntity(this.target)) {
            targetLabels = getEntityLabels(this.target, queryASTContext.neo4jGraphQLContext);
        }
        const relationship = new Cypher.Relationship();

        const pattern = new Cypher.Pattern(queryASTContext.target)
            .related(relationship, {
                type: this.relationship.type,
                direction: this.relationship.getCypherDirection(),
            })

            .to(target, { labels: targetLabels });

        const nestedContext = queryASTContext.push({ target, relationship });

        const predicate = this.createRelationshipOperation(pattern, nestedContext);
        if (predicate) {
            return this.wrapInNotIfNeeded(predicate);
        }
    }
    /**
     * Create a label predicate that filters concrete entities for interface target,
     * so that the same pattern matching can be used for all the concrete entities implemented by the interface entity.
     * Example:
     * MATCH (this:Actor)
     * WHERE EXISTS {
     *    MATCH (this)<-[this0:ACTED_IN]-(this1)
     *    WHERE (this1.title = $param0 AND (this1:Movie OR this1:Show)
     * }
     * RETURN this { .name } AS this
     **/
    protected getLabelPredicate(context: QueryASTContext): Cypher.Predicate | undefined {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        if (isConcreteEntity(this.target)) return undefined;
        const labelPredicate = this.target.concreteEntities.map((e) => {
            return context.target.hasLabels(...e.labels);
        });
        return Cypher.or(...labelPredicate);
    }

    protected createRelationshipOperation(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Predicate | undefined {
        const connectionFilter = this.innerFilters.map((c) => c.getPredicate(queryASTContext));
        const labelPredicate = this.getLabelPredicate(queryASTContext);
        const innerPredicate = Cypher.and(...connectionFilter, labelPredicate);

        if (!innerPredicate) return undefined;

        switch (this.operator) {
            case "ALL": {
                const match = new Cypher.Match(pattern).where(innerPredicate);
                const negativeMatch = new Cypher.Match(pattern).where(Cypher.not(innerPredicate));
                // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
                return Cypher.and(new Cypher.Exists(match), Cypher.not(new Cypher.Exists(negativeMatch)));
            }
            case "SINGLE": {
                return this.createSingleRelationshipOperation(pattern, queryASTContext, innerPredicate);
            }
            default: {
                if (!this.relationship.isList) {
                    return this.createSingleRelationshipOperation(pattern, queryASTContext, innerPredicate);
                }
                const match = new Cypher.Match(pattern).where(innerPredicate);
                return new Cypher.Exists(match);
            }
        }
    }

    protected createSingleRelationshipOperation(
        pattern: Cypher.Pattern,
        context: QueryASTContext,
        innerPredicate: Cypher.Predicate
    ) {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const patternComprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1)).where(
            innerPredicate
        );
        return Cypher.single(context.target, patternComprehension, new Cypher.Literal(true));
    }

    private getSubqueriesForDefaultOperations(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Clause[] {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        const match = new Cypher.Match(pattern);
        const returnVar = new Cypher.Variable();
        const innerFiltersPredicates: Cypher.Predicate[] = [];

        const subqueries = this.innerFilters.flatMap((f) => {
            const nestedSubqueries = f
                .getSubqueries(queryASTContext)
                .map((sq) => new Cypher.Call(sq).importWith(queryASTContext.target));
            const selection = f.getSelection(queryASTContext);
            const predicate = f.getPredicate(queryASTContext);
            const clauses = [...selection, ...nestedSubqueries];
            if (predicate) {
                innerFiltersPredicates.push(predicate);
                return clauses;
            }

            return clauses;
        });

        if (subqueries.length === 0) return []; // Hack logic to change predicates logic

        const comparisonValue = this.isNot ? Cypher.false : Cypher.true;
        this.subqueryPredicate = Cypher.eq(returnVar, comparisonValue);

        const countComparisonPredicate =
            this.operator === "SINGLE"
                ? Cypher.eq(Cypher.count(queryASTContext.target), new Cypher.Literal(1))
                : Cypher.gt(Cypher.count(queryASTContext.target), new Cypher.Literal(0));

        const withPredicateReturn = new Cypher.With("*")
            .where(Cypher.and(...innerFiltersPredicates))
            .return([countComparisonPredicate, returnVar]);
        return [Cypher.concat(match, ...subqueries, withPredicateReturn)];
    }

    // This method has a big deal of complexity due to a couple of factors:
    // 1. "All" operations require 2 CALL subqueries
    // 2. Each subquery has its own return variable, that needs to be carried over to the predicate
    private getSubqueriesForOperationAll(pattern: Cypher.Pattern, queryASTContext: QueryASTContext): Cypher.Clause[] {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        const match = new Cypher.Match(pattern);
        const match2 = new Cypher.Match(pattern);

        const truthyFilters: Cypher.Variable[] = [];
        const falsyFilters: Cypher.Variable[] = [];

        const subqueries = this.innerFilters.flatMap((f) => {
            const nestedSubqueries = f.getSubqueries(queryASTContext).map((sq) => {
                const predicate = f.getPredicate(queryASTContext);
                if (predicate) {
                    const returnVar = new Cypher.Variable();
                    truthyFilters.push(returnVar);
                    return new Cypher.Call(sq)
                        .importWith(queryASTContext.target)
                        .with("*")
                        .where(predicate)
                        .return([Cypher.gt(Cypher.count(queryASTContext.target), new Cypher.Literal(0)), returnVar]);
                }
            });

            return nestedSubqueries;
        });

        if (subqueries.length === 0) return [];

        const subqueries2 = this.innerFilters.flatMap((f) => {
            const nestedSubqueries = f.getSubqueries(queryASTContext).map((sq) => {
                const predicate = f.getPredicate(queryASTContext);
                if (predicate) {
                    const returnVar = new Cypher.Variable();
                    falsyFilters.push(returnVar);
                    return new Cypher.Call(sq)
                        .importWith(queryASTContext.target)
                        .with("*")
                        .where(Cypher.not(predicate))
                        .return([Cypher.gt(Cypher.count(queryASTContext.target), new Cypher.Literal(0)), returnVar]);
                }
            });

            return nestedSubqueries;
        });

        const falsyPredicates = falsyFilters.map((v) => Cypher.eq(v, Cypher.false));
        const truthyPredicates = truthyFilters.map((v) => Cypher.eq(v, Cypher.true));
        this.subqueryPredicate = Cypher.and(...falsyPredicates, ...truthyPredicates);

        return [Cypher.concat(match, ...subqueries), Cypher.concat(match2, ...subqueries2)];
    }

    private wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
