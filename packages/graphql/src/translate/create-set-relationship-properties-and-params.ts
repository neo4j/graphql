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

import type { Relationship } from "../classes";
import type { CallbackBucket } from "../classes/CallbackBucket";
import mapToDbProperty from "../utils/map-to-db-property";
import { addCallbackAndSetParam } from "./utils/callback-utils";

/*
    TODO - lets reuse this function for setting either node or rel properties.
           This was not reused due to the large differences between node fields
           - and relationship fields.
*/
function createSetRelationshipPropertiesAndParams({
    properties,
    varName,
    relationship,
    operation,
    callbackBucket,
}: {
    properties: Record<string, unknown>;
    varName: string;
    relationship: Relationship;
    operation: "CREATE" | "UPDATE";
    callbackBucket: CallbackBucket;
}): [string, any] {
    const strs: string[] = [];
    const params = {};

    const propertiesObj =
        relationship.properties && properties[relationship.properties]
            ? (properties[relationship.properties] as Record<string, unknown>)
            : properties;

    relationship.primitiveFields.forEach((primitiveField) => {
        if (primitiveField?.autogenerate) {
            if (operation === "CREATE") {
                strs.push(`SET ${varName}.${primitiveField.dbPropertyName} = randomUUID()`);
            }
        }
    });

    relationship.temporalFields.forEach((temporalField) => {
        if (
            ["DateTime", "Time"].includes(temporalField.typeMeta.name) &&
            temporalField?.timestamps?.includes(operation)
        ) {
            // DateTime -> datetime(); Time -> time()
            strs.push(
                `SET ${varName}.${temporalField.dbPropertyName} = ${temporalField.typeMeta.name.toLowerCase()}()`
            );
        }
    });

    [...relationship.primitiveFields, ...relationship.temporalFields].forEach((field) =>
        addCallbackAndSetParam(field, varName, propertiesObj, callbackBucket, strs, operation)
    );

    Object.entries(propertiesObj).forEach(([key, value]) => {
        const paramName = `${varName}_${key}`;

        const pointField = relationship.pointFields.find((x) => x.fieldName === key);
        if (pointField) {
            if (pointField.typeMeta.array) {
                strs.push(`SET ${varName}.${pointField.dbPropertyName} = [p in $${paramName} | point(p)]`);
            } else {
                strs.push(`SET ${varName}.${pointField.dbPropertyName} = point($${paramName})`);
            }

            params[paramName] = value;

            return;
        }

        const dbFieldName = mapToDbProperty(relationship, key);
        strs.push(`SET ${varName}.${dbFieldName} = $${paramName}`);
        params[paramName] = value;
    });

    return [strs.join("\n"), params];
}

export default createSetRelationshipPropertiesAndParams;
