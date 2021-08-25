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

import { Relationship } from "../classes";

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
}: {
    properties: Record<string, unknown>;
    varName: string;
    relationship: Relationship;
    operation: "CREATE" | "UPDATE";
}): [string, any] {
    const strs: string[] = [];
    const params = {};

    relationship.primitiveFields.forEach((primitiveField) => {
        if (primitiveField?.autogenerate) {
            if (operation === "CREATE") {
                strs.push(`SET ${varName}.${primitiveField.fieldName} = randomUUID()`);
            }
        }
    });

    relationship.dateTimeFields.forEach((dateTimeField) => {
        if (dateTimeField?.timestamps?.includes(operation)) {
            strs.push(`SET ${varName}.${dateTimeField.fieldName} = datetime()`);
        }
    });

    Object.entries(properties).forEach(([key, value]) => {
        const paramName = `${varName}_${key}`;

        const pointField = relationship.pointFields.find((x) => x.fieldName === key);
        if (pointField) {
            if (pointField.typeMeta.array) {
                strs.push(`SET ${varName}.${dbFieldName} = [p in $${paramName} | point(p)]`);
            } else {
                strs.push(`SET ${varName}.${dbFieldName} = point($${paramName})`);
            }

            params[paramName] = value;

            return;
        }

        strs.push(`SET ${varName}.${dbFieldName} = $${paramName}`);
        params[paramName] = value;
    });

    return [strs.join("\n"), params];
}

export default createSetRelationshipPropertiesAndParams;
