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
import { createNodeFromEntity, createRelationshipFromEntity } from "../../../utils/create-node-from-entity";
import { wrapSubqueriesInCypherCalls } from "../../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../../QueryASTContext";
import { QueryASTNode } from "../../QueryASTNode";

export class CompositeAggregationPartial extends QueryASTNode {
    public readonly entity?: RelationshipAdapter; // TODO: rename to relationship
    public readonly target: ConcreteEntityAdapter;
    protected directed: boolean;

    constructor({
        target,
        entity,
        directed = true,
    }: {
        target: ConcreteEntityAdapter;
        entity?: RelationshipAdapter;
        directed?: boolean;
    }) {
        super();
        this.entity = entity;
        this.target = target;
        this.directed = directed;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!context.target) throw new Error("No target node found!");

        const targetNode = createNodeFromEntity(this.target, context.neo4jGraphQLContext);
        let pattern: Cypher.Pattern;
        if (this.entity instanceof RelationshipAdapter) {
            const relVar = createRelationshipFromEntity(this.entity);
            const relDirection = this.entity.getCypherDirection(this.directed);

            pattern = new Cypher.Pattern(context.target)
                .withoutLabels()
                .related(relVar)
                .withDirection(relDirection)
                .to(targetNode);
        } else {
            pattern = new Cypher.Pattern(targetNode);
        }

        const matchClause = new Cypher.Match(pattern);

        const nestedSubqueries = wrapSubqueriesInCypherCalls(context, this.getChildren(), [targetNode]);

        return [
            Cypher.concat(matchClause, ...nestedSubqueries, new Cypher.Return([targetNode, context.returnVariable])),
        ];
    }

    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }
}
