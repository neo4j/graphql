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
import { createComparisonOperation } from "../../../utils/create-comparison-operator";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";
import { hasTarget } from "../../../utils/context-has-target";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";

export class PropertyFilter extends Filter {
    protected attribute: AttributeAdapter;
    protected relationship: RelationshipAdapter | undefined;
    protected comparisonValue: unknown;
    protected operator: FilterOperator;
    protected isNot: boolean; // _NOT is deprecated
    protected attachedTo: "node" | "relationship";

    constructor({
        attribute,
        relationship,
        comparisonValue,
        operator,
        isNot,
        attachedTo,
    }: {
        attribute: AttributeAdapter;
        relationship?: RelationshipAdapter;
        comparisonValue: unknown;
        operator: FilterOperator;
        isNot: boolean;
        attachedTo?: "node" | "relationship";
    }) {
        super();
        this.attribute = attribute;
        this.relationship = relationship;
        this.comparisonValue = comparisonValue;
        this.operator = operator;
        this.isNot = isNot;
        this.attachedTo = attachedTo ?? "node";
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} [${this.attribute.name}] <${this.isNot ? "NOT " : ""}${this.operator}>`;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate {
        const prop = this.getPropertyRefOrAliasesCase(queryASTContext);

        if (this.comparisonValue === null) {
            return this.getNullPredicate(prop);
        }

        const baseOperation = this.getOperation(prop);

        return this.wrapInNotIfNeeded(baseOperation);
    }

    private getPropertyRefOrAliasesCase(queryASTContext: QueryASTContext): Cypher.Property | Cypher.Case {
        const implementationsWithAlias = this.getAliasesToResolve();
        if (implementationsWithAlias) {
            return this.generateCaseForAliasedFields(queryASTContext, implementationsWithAlias);
        }
        return this.getPropertyRef(queryASTContext);
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
            throw new Error("Transpilation error");
        }
    }

    /** Returns the operation for a given filter.
     * To be overridden by subclasses
     */
    protected getOperation(prop: Cypher.Property | Cypher.Case): Cypher.ComparisonOp {
        return this.createBaseOperation({
            operator: this.operator,
            property: prop,
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    /** Returns the default operation for a given filter */
    protected createBaseOperation({
        operator,
        property,
        param,
    }: {
        operator: FilterOperator;
        property: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        const coalesceProperty = this.coalesceValueIfNeeded(property);

        return createComparisonOperation({ operator, property: coalesceProperty, param });
    }

    protected coalesceValueIfNeeded(expr: Cypher.Expr): Cypher.Expr {
        if (this.attribute.annotations.coalesce) {
            const value = this.attribute.annotations.coalesce.value;
            const literal = new Cypher.Literal(value);
            return Cypher.coalesce(expr, literal);
        }
        return expr;
    }

    private getNullPredicate(propertyRef: Cypher.Property | Cypher.Case): Cypher.Predicate {
        if (this.isNot) {
            return Cypher.isNotNull(propertyRef);
        } else {
            return Cypher.isNull(propertyRef);
        }
    }

    private wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
