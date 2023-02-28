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

import { GraphQLInt } from "graphql";
import type { InputTypeComposer } from "graphql-compose";
import { SCALAR_TYPES } from "../constants";
import type { BaseField } from "../types";

export function addArrayMethodsToITC(itc: InputTypeComposer, fields: BaseField[]): void {
    // Add array methods for array fields
    const allowedArrayFieldTypes = [...SCALAR_TYPES, "Point", "CartesianPoint"];
    const arrayFields = fields.filter(
        (field) => field.typeMeta.array && allowedArrayFieldTypes.includes(field.typeMeta.name),
    );
    arrayFields.forEach((arrayField) => {
        itc.addFields({
            [`${arrayField.fieldName}_POP`]: GraphQLInt,
            [`${arrayField.fieldName}_PUSH`]: arrayField.typeMeta.input.update.pretty,
        });
    });
}
