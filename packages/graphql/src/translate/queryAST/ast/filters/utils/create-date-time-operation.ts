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
import type { FilterOperator } from "../Filter";

export function createDateTimeOperation({
    operator,
    property,
    param,
    attribute,
}: {
    operator: FilterOperator;
    property: Cypher.Expr;
    param: Cypher.Param | Cypher.Variable | Cypher.Property;
    attribute: AttributeAdapter;
}): Cypher.ComparisonOp {
    const datetime = Cypher.datetime(param);

    switch (operator) {
        case "LT":
            return Cypher.lt(property, datetime);
        case "LTE":
            return Cypher.lte(property, datetime);
        case "GT":
            return Cypher.gt(property, datetime);
        case "GTE":
            return Cypher.gte(property, datetime);
        case "EQ": {
            if (attribute.typeHelper.isList()) {
                const dateTimeList = createDateTimeListComprehension(param);
                return Cypher.eq(property, dateTimeList);
            }

            return Cypher.eq(property, datetime);
        }
        case "IN": {
            const dateTimeList = createDateTimeListComprehension(param);
            return Cypher.in(property, dateTimeList);
        }
        case "INCLUDES":
            return Cypher.in(datetime, property);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createDateTimeListComprehension(
    param: Cypher.Param | Cypher.Variable | Cypher.Property
): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapDateTime = Cypher.datetime(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar, param).map(mapDateTime);
}
