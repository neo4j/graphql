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
import { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { AggregationLogicalOperator } from "../../../factory/parsers/parse-where-field";
import { getEntityLabels } from "../../../utils/create-node-from-entity";
import type { QueryASTContext } from "../../QueryASTContext";
import { Filter } from "../Filter";

export abstract class AggregationFilter extends Filter {
    protected subqueryReturnVariable: Cypher.Variable | undefined;
    protected relationship: RelationshipAdapter;
    protected isDeprecated: boolean;
    protected attachedTo: "node" | "relationship";
    constructor(relationship: RelationshipAdapter, isDeprecated = false, attachedTo: "node" | "relationship") {
        super();
        this.relationship = relationship;
        this.isDeprecated = isDeprecated;
        this.attachedTo = attachedTo;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }

        this.subqueryReturnVariable = new Cypher.Variable();
        const relatedEntity = this.relationship.target;

        const relatedNode: Cypher.Node = new Cypher.Node();
        let relatedNodeLabels: string[] = [];
        let labelsFilter: Cypher.Predicate | undefined;

        if (relatedEntity instanceof InterfaceEntityAdapter) {
            const labelsForImplementations = relatedEntity.concreteEntities.map((e) =>
                relatedNode.hasLabels(...e.getLabels())
            );
            labelsFilter = Cypher.or(...labelsForImplementations);
        } else {
            relatedNodeLabels = getEntityLabels(relatedEntity, context.neo4jGraphQLContext);
        }
        const relationshipTarget = new Cypher.Relationship();

        const pattern = new Cypher.Pattern(context.target)
            .related(relationshipTarget, {
                direction: this.relationship.getCypherDirection(),
                type: this.relationship.type,
            })
            .to(relatedNode, { labels: relatedNodeLabels });

        const nestedContext = context.push({
            target: relatedNode,
            relationship: relationshipTarget,
        });

        const returnColumns: Cypher.ProjectionColumn[] = [];
        const predicate = this.getSubqueryReturnVariable(nestedContext);
        if (predicate) {
            returnColumns.push([predicate, this.subqueryReturnVariable]);
        }

        if (returnColumns.length === 0) {
            throw new Error(
                `Transpile error: An error occurred when trying to get the predicate for the ${this.constructor.name}`
            );
        }
        const match = this.shouldApplyDistinct()
            ? new Cypher.Match(pattern).with(nestedContext.target).distinct()
            : new Cypher.Match(pattern);

        const subquery = labelsFilter
            ? match.where(labelsFilter).return(...returnColumns)
            : match.return(...returnColumns);
        return [subquery];
    }

    public getPredicate(): Cypher.Predicate | undefined {
        if (this.subqueryReturnVariable) {
            return Cypher.eq(this.subqueryReturnVariable, Cypher.true);
        }
        throw new Error(
            `Transpile error: An error occurred when trying to get the predicate for the ${this.constructor.name}`
        );
    }

    protected createBaseOperation({
        operator,
        expr,
        param,
    }: {
        operator: AggregationLogicalOperator;
        expr: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        switch (operator) {
            case "LT":
                return Cypher.lt(expr, param);
            case "LTE":
                return Cypher.lte(expr, param);
            case "GT":
                return Cypher.gt(expr, param);
            case "GTE":
                return Cypher.gte(expr, param);
            case "IN":
                return Cypher.in(expr, param);
            case "EQUAL":
            case "EQ":
                return Cypher.eq(expr, param);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }

    protected abstract getSubqueryReturnVariable(queryASTContext: QueryASTContext): Cypher.Predicate | undefined;

    private shouldApplyDistinct(): boolean {
        // DISTINCT is only applied on aggregations inside Connections input
        return !this.isDeprecated && this.attachedTo === "node";
    }
}
