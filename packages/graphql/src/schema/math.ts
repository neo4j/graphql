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

import { InputTypeComposer } from "graphql-compose";

export function addMathOperatorsToITC(itc: InputTypeComposer): InputTypeComposer {
    // Add mathematical operators for Int/BigInt/Float fields
    itc.getFieldNames().forEach(fieldName => {
        const fieldType = itc.getFieldTypeName(fieldName);
        if (fieldType === 'Int' || fieldType === 'BigInt') {
            itc.addFields({[`${fieldName}_INCREMENT`]: { type: fieldType }});
            itc.addFields({[`${fieldName}_DECREMENT`]: { type: fieldType }});
        } else if (fieldType === 'Float') {
            itc.addFields({[`${fieldName}_ADD`]: { type: fieldType }});
            itc.addFields({[`${fieldName}_SUBTRACT`]: { type: fieldType }});
            itc.addFields({[`${fieldName}_DIVIDE`]: { type: fieldType }});
            itc.addFields({[`${fieldName}_MULTIPLY`]: { type: fieldType }});
        }
    });
    return itc;
}