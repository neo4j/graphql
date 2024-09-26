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

import { parseWhereField } from "../../../../../translate/queryAST/factory/parsers/parse-where-field";

export function parseFilterProperty(key: string): { fieldName: string; operator: string | undefined } {
    // eslint-disable-next-line prefer-const
    let { fieldName: stuff, operator: operatorStuff, isNot } = parseWhereField(key);

    // These conversions are only temporary necessary until the the _NOT operator exists, after that we can just return the output of parseWhereField
    if (operatorStuff === "EQ") {
        operatorStuff = undefined;
    }
    if (isNot) {
        if (operatorStuff && isAPossibleNotOperator(operatorStuff)) {
            operatorStuff = `NOT_${operatorStuff}`;
        } else {
            operatorStuff = "NOT";
        }
    }
    return { fieldName: stuff, operator: operatorStuff };
}

function isAPossibleNotOperator(
    operator: string
): operator is "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "IN" | "INCLUDES" {
    return (["CONTAINS", "STARTS_WITH", "ENDS_WITH", "IN", "INCLUDES"] as const).includes(
        operator as "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "IN" | "INCLUDES"
    );
}
