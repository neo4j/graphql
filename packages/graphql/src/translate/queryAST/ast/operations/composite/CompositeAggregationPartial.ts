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
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../../utils/utils";
import { getEntityLabels } from "../../../utils/create-node-from-entity";
import { wrapSubqueriesInCypherCalls } from "../../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../../QueryASTContext";
import { QueryASTNode } from "../../QueryASTNode";
import type { AuthorizationFilters } from "../../filters/authorization-filters/AuthorizationFilters";

export class CompositeAggregationPartial extends QueryASTNode {
    public readonly entity?: RelationshipAdapter;
    public readonly target: ConcreteEntityAdapter;
    protected directed: boolean;
    protected attachedTo: "node" | "relationship";
    protected authFilters: AuthorizationFilters[] = [];

    constructor({
        target,
        entity,
        directed = true,
        attachedTo,
    }: {
        target: ConcreteEntityAdapter;
        entity?: RelationshipAdapter;
        directed?: boolean;
        attachedTo?: "node" | "relationship";
    }) {
        super();
        this.entity = entity;
        this.target = target;
        this.directed = directed;
        this.attachedTo = attachedTo ?? "node";
    }

    public getChildren(): QueryASTNode[] {
        return this.authFilters;
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!context.target) {
            throw new Error("No parent node found!");
        }

        let pattern: Cypher.Pattern;
        const targetNode = new Cypher.Node();
        const targetNodeLabels = getEntityLabels(this.target, context.neo4jGraphQLContext);
        let target: Cypher.Node | Cypher.Relationship = targetNode;

        const authFilterPredicates = this.getAuthFilterPredicate(context);

        if (this.entity instanceof RelationshipAdapter) {
            const relVar = new Cypher.Relationship();
            const relDirection = this.entity.getCypherDirection(this.directed);
            if (this.attachedTo === "relationship") {
                target = relVar;
            }

            pattern = new Cypher.Pattern(context.target)
                .related(relVar, { direction: relDirection, type: this.entity.type })
                .to(targetNode, { labels: targetNodeLabels });

            const matchClause = new Cypher.Match(pattern).where(Cypher.and(...authFilterPredicates));

            const nestedSubqueries = wrapSubqueriesInCypherCalls(context, this.getChildren(), [target]);

            return [
                Cypher.concat(
                    matchClause,
                    ...nestedSubqueries,
                    new Cypher.Return([targetNode, "node"], [relVar, "edge"])
                ),
            ];
        } else {
            pattern = new Cypher.Pattern(targetNode, { labels: targetNodeLabels });
            const matchClause = new Cypher.Match(pattern).where(Cypher.and(...authFilterPredicates));

            const nestedSubqueries = wrapSubqueriesInCypherCalls(context, this.getChildren(), [target]);

            return [Cypher.concat(matchClause, ...nestedSubqueries, new Cypher.Return([targetNode, "node"]))];
        }
    }

    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }

    public setAttachedTo(attachedTo: "node" | "relationship"): void {
        this.attachedTo = attachedTo;
    }
}
