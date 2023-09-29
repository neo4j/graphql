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

import type { ObjectFields } from "../get-obj-field-meta";

type ObjectFieldsInspectionResult = {
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
};

export function inspectObjectFields(objectFields?: ObjectFields): ObjectFieldsInspectionResult {
    const result: ObjectFieldsInspectionResult = {
        hasNonGeneratedProperties: false,
        hasNonNullNonGeneratedProperties: false,
    };

    if (!objectFields) {
        return result;
    }

    const nonGeneratedProperties = [
        ...objectFields.primitiveFields.filter((field) => !field.autogenerate),
        ...objectFields.scalarFields,
        ...objectFields.enumFields,
        ...objectFields.temporalFields.filter((field) => !field.timestamps),
        ...objectFields.pointFields,
    ];
    result.hasNonGeneratedProperties = nonGeneratedProperties.length > 0;
    result.hasNonNullNonGeneratedProperties = nonGeneratedProperties.some((field) => field.typeMeta.required);

    return result;
}
