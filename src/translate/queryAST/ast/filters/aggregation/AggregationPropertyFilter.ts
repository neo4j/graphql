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
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { AggregationLogicalOperator, AggregationOperator } from "../../../factory/parsers/parse-where-field";
import { hasTarget } from "../../../utils/context-has-target";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";

export class AggregationPropertyFilter extends Filter {
    protected attribute: AttributeAdapter;
    protected relationship: RelationshipAdapter | undefined;
    protected comparisonValue: unknown;

    protected logicalOperator: AggregationLogicalOperator;
    protected aggregationOperator: AggregationOperator | undefined;
    protected attachedTo: "node" | "relationship";

    constructor({
        attribute,
        relationship,
        logicalOperator,
        comparisonValue,
        aggregationOperator,
        attachedTo,
    }: {
        attribute: AttributeAdapter;
        relationship?: RelationshipAdapter;
        logicalOperator: AggregationLogicalOperator;
        comparisonValue: unknown;
        aggregationOperator: AggregationOperator | undefined;
        attachedTo?: "node" | "relationship";
    }) {
        super();
        this.attribute = attribute;
        this.relationship = relationship;
        this.comparisonValue = comparisonValue;
        this.logicalOperator = logicalOperator;
        this.aggregationOperator = aggregationOperator;
        this.attachedTo = attachedTo ?? "node";
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    private getPropertyRefOrAliasesCase(queryASTContext: QueryASTContext): Cypher.Property | Cypher.Case {
        const implementationsWithAlias = this.getAliasesToResolve();
        if (implementationsWithAlias) {
            return this.generateCaseForAliasedFields(queryASTContext, implementationsWithAlias);
        }
        return this.getPropertyRef(queryASTContext);
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const comparisonVar = new Cypher.Variable();
        const property = this.getPropertyRefOrAliasesCase(queryASTContext);

        if (this.aggregationOperator) {
            let propertyExpr: Cypher.Expr = property;

            if (this.attribute.typeHelper.isString()) {
                propertyExpr = Cypher.size(property);
            }

            const aggrOperation = this.getAggregateOperation(propertyExpr, this.aggregationOperator);
            return this.getOperation(aggrOperation);
        } else {
            let listExpr: Cypher.Expr;

            if (this.logicalOperator !== "EQUAL" && this.attribute.typeHelper.isString()) {
                listExpr = Cypher.collect(Cypher.size(property));
            } else {
                listExpr = Cypher.collect(property);
            }

            const comparisonOperation = this.getOperation(comparisonVar);
            return Cypher.any(comparisonVar, listExpr, comparisonOperation);
        }
    }

    protected getOperation(expr: Cypher.Expr): Cypher.ComparisonOp {
        return this.createBaseOperation({
            operator: this.logicalOperator,
            property: expr,
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    private getAliasesToResolve(): [string[], string][] | undefined {
        if (!this.relationship || !(this.relationship.target instanceof InterfaceEntityAdapter)) {
            return;
        }
        const aliasedImplementationsMap = this.relationship.target.getImplementationToAliasMapWhereAliased(
            this.attribute
        );
        if (!aliasedImplementationsMap.length) {
            return;
        }
        return aliasedImplementationsMap;
    }

    private generateCaseForAliasedFields(
        queryASTContext: QueryASTContext,
        concreteLabelsToAttributeAlias: [string[], string][]
    ): Cypher.Case {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        const aliasesCase = new Cypher.Case();
        for (const [labels, databaseName] of concreteLabelsToAttributeAlias) {
            aliasesCase
                .when(queryASTContext.target.hasLabels(...labels))
                .then(queryASTContext.target.property(databaseName));
        }
        aliasesCase.else(queryASTContext.target.property(this.attribute.databaseName));
        return aliasesCase;
    }

    private getPropertyRef(queryASTContext: QueryASTContext): Cypher.Property {
        if (this.attachedTo === "node") {
            if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
            return queryASTContext.target.property(this.attribute.databaseName);
        } else if (this.attachedTo === "relationship" && queryASTContext.relationship) {
            return queryASTContext.relationship.property(this.attribute.databaseName);
        } else {
            throw new Error("Transpilation error, relationship on filter not available");
        }
    }

    private getAggregateOperation(
        property: Cypher.Property | Cypher.Function | Cypher.Case,
        aggregationOperator: string
    ): Cypher.Function {
        switch (aggregationOperator) {
            case "AVERAGE":
                return Cypher.avg(property);
            case "MIN":
            case "SHORTEST":
                return Cypher.min(property);
            case "MAX":
            case "LONGEST":
                return Cypher.max(property);
            case "SUM":
                return Cypher.sum(property);
            default:
                throw new Error(`Invalid operator ${aggregationOperator}`);
        }
    }

    /** Returns the default operation for a given filter */
    protected createBaseOperation({
        operator,
        property,
        param,
    }: {
        operator: AggregationLogicalOperator;
        property: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        switch (operator) {
            case "LT":
                return Cypher.lt(property, param);
            case "LTE":
                return Cypher.lte(property, param);
            case "GT":
                return Cypher.gt(property, param);
            case "GTE":
                return Cypher.gte(property, param);
            case "EQUAL":
                return Cypher.eq(property, param);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }
}
