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
import type { Attribute } from "../../../../../schema-model/attribute/Attribute";
import { Filter, type WhereOperator } from "../Filter";
import type { QueryASTContext } from "../../QueryASTContext";

type FilterOperator = WhereOperator | "EQ";

export class PropertyFilter extends Filter {
    protected attribute: Attribute;
    protected comparisonValue: unknown;
    protected operator: FilterOperator;
    protected isNot: boolean; // _NOT is deprecated
    protected attachedTo: "node" | "relationship";

    constructor({
        attribute,
        comparisonValue,
        operator,
        isNot,
        attachedTo,
    }: {
        attribute: Attribute;
        comparisonValue: unknown;
        operator: FilterOperator;
        isNot: boolean;
        attachedTo?: "node" | "relationship";
    }) {
        super();
        this.attribute = attribute;
        this.comparisonValue = comparisonValue;
        this.operator = operator;
        this.isNot = isNot;
        this.attachedTo = attachedTo ?? "node";
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate {
        //const prop = target.property(this.attribute.name);
        const prop = this.getPropertyRef(queryASTContext);

        if (this.comparisonValue === null) {
            return this.getNullPredicate(prop);
        }

        const baseOperation = this.getOperation(prop);

        return this.wrapInNotIfNeeded(baseOperation);
    }

    private getPropertyRef(queryASTContext: QueryASTContext): Cypher.Property {
        if (this.attachedTo === "node") {
            return queryASTContext.target.property(this.attribute.name);
        } else if (this.attachedTo === "relationship" && queryASTContext.relationship) {
            return queryASTContext.relationship.property(this.attribute.name);
        } else {
            throw new Error("Transpilation error");
        }
    }

    /** Returns the operation for a given filter.
     * To be overridden by subclasses
     */
    protected getOperation(prop: Cypher.Property): Cypher.ComparisonOp {
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
        switch (operator) {
            case "LT":
                return Cypher.lt(property, param);
            case "LTE":
                return Cypher.lte(property, param);
            case "GT":
                return Cypher.gt(property, param);
            case "GTE":
                return Cypher.gte(property, param);
            case "ENDS_WITH":
                return Cypher.endsWith(property, param);
            case "STARTS_WITH":
                return Cypher.startsWith(property, param);
            case "MATCHES":
                return Cypher.matches(property, param);
            case "CONTAINS":
                return Cypher.contains(property, param);
            case "IN":
                return Cypher.in(property, param);
            case "INCLUDES":
                return Cypher.in(param, property);
            case "EQ":
                return Cypher.eq(property, param);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }

    private getNullPredicate(propertyRef: Cypher.Property): Cypher.Predicate {
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
