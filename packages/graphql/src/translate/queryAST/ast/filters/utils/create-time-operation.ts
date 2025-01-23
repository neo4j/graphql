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

export function createTimeOperation({
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
    const time = Cypher.time(param);

    switch (operator) {
        case "LT":
            return Cypher.lt(property, time);
        case "LTE":
            return Cypher.lte(property, time);
        case "GT":
            return Cypher.gt(property, time);
        case "GTE":
            return Cypher.gte(property, time);
        case "EQ": {
            if (attribute.typeHelper.isList()) {
                const timeList = createTimeListComprehension(param);
                return Cypher.eq(property, timeList);
            }

            return Cypher.eq(property, time);
        }
        case "IN": {
            const timeList = createTimeListComprehension(param);
            return Cypher.in(property, timeList);
        }
        case "INCLUDES":
            return Cypher.in(time, property);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createTimeListComprehension(
    param: Cypher.Param | Cypher.Variable | Cypher.Property
): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapTime = Cypher.time(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar, param).map(mapTime);
}
