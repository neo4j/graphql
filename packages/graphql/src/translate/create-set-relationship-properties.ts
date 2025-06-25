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

import { type Relationship } from "../classes";
import type { CallbackBucketDeprecated } from "../classes/CallbackBucketDeprecated";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import { assertNonAmbiguousUpdate } from "./utils/assert-non-ambiguous-update";
import { addCallbackAndSetParam } from "./utils/callback-utils";
import { getMutationFieldStatements } from "./utils/get-mutation-field-statements";

export function createSetRelationshipProperties({
    properties,
    varName,
    withVars,
    relationship,
    relationshipAdapter,
    operation,
    callbackBucket,
    parameterPrefix,
    parameterNotation,
    isUpdateOperation = false,
}: {
    properties: Record<string, Record<string, unknown>>;
    varName: string;
    withVars: string[];
    relationship: Relationship;
    relationshipAdapter?: RelationshipAdapter;
    operation: "CREATE" | "UPDATE";
    callbackBucket: CallbackBucketDeprecated;
    parameterPrefix: string;
    parameterNotation: "." | "_";
    isUpdateOperation?: boolean;
}): [string, Record<string, any>] | undefined {
    // setting properties on the edge of an Interface relationship
    // the input can contain other properties than the one applicable for this concrete entity relationship field
    if (Object.keys(properties).find((k) => relationshipAdapter?.siblings?.includes(k))) {
        const applicableProperties = properties[relationship.properties as string];
        if (applicableProperties) {
            return createSetRelationshipPropertiesForProperties({
                properties: applicableProperties,
                varName,
                withVars,
                relationship,
                operation,
                callbackBucket,
                parameterPrefix: `${parameterPrefix}${parameterNotation}${relationship.properties}`,
                parameterNotation,
                isUpdateOperation,
            });
        }
        return;
    }
    return createSetRelationshipPropertiesForProperties({
        properties,
        varName,
        withVars,
        relationship,
        operation,
        callbackBucket,
        parameterPrefix,
        parameterNotation,
        isUpdateOperation,
    });
}

function createSetRelationshipPropertiesForProperties({
    properties,
    varName,
    withVars,
    relationship,
    operation,
    callbackBucket,
    parameterPrefix,
    parameterNotation,
    isUpdateOperation,
}: {
    properties: Record<string, unknown>;
    varName: string;
    withVars: string[];
    relationship: Relationship;
    operation: "CREATE" | "UPDATE";
    callbackBucket: CallbackBucketDeprecated;
    parameterPrefix: string;
    parameterNotation: "." | "_";
    isUpdateOperation: boolean;
}): [string, Record<string, any>] {
    assertNonAmbiguousUpdate(relationship, properties);
    const strs: string[] = [];
    const params = {};

    addAutogenerateProperties({ relationship, operation, varName, strs });
    [...relationship.primitiveFields, ...relationship.temporalFields].forEach((field) =>
        addCallbackAndSetParam(field, varName, properties, callbackBucket, strs, operation)
    );

    Object.entries(properties).forEach(([key, value], _idx) => {
        const param = `${parameterPrefix}${parameterNotation}${key}`;
        const mutationFieldStatements = getMutationFieldStatements({
            nodeOrRel: relationship,
            param,
            key,
            varName,
            value,
            withVars,
            isUpdateOperation,
        });
        strs.push(mutationFieldStatements);
        params[param] = value;
    });

    return [strs.join("\n"), params];
}

function addAutogenerateProperties({
    relationship,
    operation,
    varName,
    strs,
}: {
    relationship: Relationship;
    operation: "CREATE" | "UPDATE";
    varName: string;
    strs: string[];
}) {
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
}
