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
import { AttributeType, type Attribute } from "../../../../schema-model/attribute/Attribute";
import type { WhereOperator } from "./Filter";
import { QueryASTNode } from "../QueryASTNode";

export class PropertyFilter extends QueryASTNode {
    private attribute: Attribute;
    private comparisonValue: unknown;
    private operator: WhereOperator | undefined;
    private isNot: boolean; // _NOT is deprecated

    constructor({
        attribute,
        comparisonValue,
        operator,
        isNot,
    }: {
        attribute: Attribute;
        comparisonValue: unknown;
        operator: WhereOperator | undefined;
        isNot: boolean;
    }) {
        super();
        this.attribute = attribute;
        this.comparisonValue = comparisonValue;
        this.operator = operator;
        this.isNot = isNot;
    }

    public getPredicate(target: Cypher.Variable): Cypher.Predicate {
        const prop = target.property(this.attribute.name);

        if (this.comparisonValue === null) {
            return this.getNullPredicate(prop);
        }

        let baseOperation: Cypher.Predicate;
        if (this.attribute.type === AttributeType.Point) {
            // TODO: use inheritance
            baseOperation = this.createPointOperation({
                operator: this.operator || "EQ",
                property: prop,
                param: new Cypher.Param(this.comparisonValue),
                attribute: this.attribute,
            });
        } else if (this.attribute.type === AttributeType.Duration && this.operator) {
            baseOperation = this.createDurationOperation({
                operator: this.operator,
                property: prop,
                param: new Cypher.Param(this.comparisonValue),
            });
        } else {
            baseOperation = this.createBaseOperation({
                operator: this.operator || "EQ",
                property: prop,
                param: new Cypher.Param(this.comparisonValue),
            });
        }

        return this.wrapInNotIfNeeded(baseOperation);

        // return Cypher.eq(prop, new Cypher.Param(this.comparisonValue));
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

    private createBaseOperation({
        operator,
        property,
        param,
    }: {
        operator: WhereOperator | "EQ";
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

    private createPointOperation({
        operator,
        property,
        param,
        attribute,
    }: {
        operator: WhereOperator | "EQ";
        property: Cypher.Expr;
        param: Cypher.Param;
        attribute: Attribute;
    }): Cypher.ComparisonOp {
        const pointDistance = this.createPointDistanceExpression(property, param);
        const distanceRef = param.property("distance");
        const isArray = attribute.isArray;

        switch (operator || "EQ") {
            case "LT":
                return Cypher.lt(pointDistance, distanceRef);
            case "LTE":
                return Cypher.lte(pointDistance, distanceRef);
            case "GT":
                return Cypher.gt(pointDistance, distanceRef);
            case "GTE":
                return Cypher.gte(pointDistance, distanceRef);
            case "DISTANCE":
                return Cypher.eq(pointDistance, distanceRef);
            case "EQ": {
                if (isArray) {
                    const pointList = this.createPointListComprehension(param);
                    return Cypher.eq(property, pointList);
                }

                return Cypher.eq(property, Cypher.point(param));
            }
            case "IN": {
                const pointList = this.createPointListComprehension(param);
                return Cypher.in(property, pointList);
            }
            case "INCLUDES":
                return Cypher.in(Cypher.point(param), property);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }

    private createDurationOperation({
        operator,
        property,
        param,
    }: {
        operator: WhereOperator | "EQ";
        property: Cypher.Expr;
        param: Cypher.Expr;
    }) {
        const variable = Cypher.plus(Cypher.datetime(), param);
        const propertyRef = Cypher.plus(Cypher.datetime(), property);

        return this.createBaseOperation({
            operator,
            property: propertyRef,
            param: variable,
        });
    }
    private createPointListComprehension(param: Cypher.Param): Cypher.ListComprehension {
        const comprehensionVar = new Cypher.Variable();
        const mapPoint = Cypher.point(comprehensionVar);
        return new Cypher.ListComprehension(comprehensionVar, param).map(mapPoint);
    }

    private createPointDistanceExpression(property: Cypher.Expr, param: Cypher.Param): Cypher.Function {
        const nestedPointRef = param.property("point");

        // if (neo4jDatabaseInfo.gte("4.4")) {
        return Cypher.pointDistance(property, Cypher.point(nestedPointRef));
        // }
        // return Cypher.distance(property, Cypher.point(nestedPointRef));
    }
}
