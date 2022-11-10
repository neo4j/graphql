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

import type { InputTypeComposer } from "graphql-compose";

export function addMathOperatorsToITC(itc: InputTypeComposer): void {
    // Add mathematical operators for Int/BigInt/Float fields
    itc.getFieldNames().forEach((fieldName) => {
        const fieldType = itc.getFieldTypeName(fieldName);
        const deprecatedDirectives = itc
            .getFieldDirectives(fieldName)
            .filter((directive) => directive.name === "deprecated");
        const fieldDefinition = {
            type: fieldType,
            directives: deprecatedDirectives,
        };
        if (fieldType === "Int" || fieldType === "BigInt") {
            itc.addFields({
                [`${fieldName}_INCREMENT`]: fieldDefinition,
                [`${fieldName}_DECREMENT`]: fieldDefinition,
            });
        } else if (fieldType === "Float") {
            itc.addFields({
                [`${fieldName}_ADD`]: fieldDefinition,
                [`${fieldName}_SUBTRACT`]: fieldDefinition,
                [`${fieldName}_DIVIDE`]: fieldDefinition,
                [`${fieldName}_MULTIPLY`]: fieldDefinition,
            });
        }
    });
}
