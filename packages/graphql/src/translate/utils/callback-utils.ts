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
import type { CallbackBucket } from "../../classes/CallbackBucket";
import type { PrimitiveField } from "../../types";
import { compileCypher } from "../../utils/compile-cypher";

export const addCallbackAndSetParam = (
    field: PrimitiveField,
    varName: string,
    parent: any,
    callbackBucket: CallbackBucket,
    strs: string[],
    operation: "CREATE" | "UPDATE"
): void => {
    if (!field.callback || !field.callback.operations.includes(operation)) {
        return;
    }

    const paramName = `${varName}_${field.fieldName}_${field.callback?.callbackName}`;

    callbackBucket.addCallback({
        functionName: field.callback?.callbackName,
        paramName,
        parent,
        type: field.typeMeta,
    });

    strs.push(`SET ${varName}.${field.dbPropertyName} = $resolvedCallbacks.${paramName}`);
};

export const addCallbackAndSetParamCypher = (
    field: PrimitiveField,
    variable: Cypher.Variable,
    parent: any,
    callbackBucket: CallbackBucket,
    operation: "CREATE" | "UPDATE",
    node: Cypher.Node
): [Cypher.Property, Cypher.Raw] | [] => {
    if (!field.callback || !field.callback.operations.includes(operation)) {
        return [];
    }

    const propRef = node.property(field.dbPropertyName as string);
    const rawCypherStatement = new Cypher.Raw((env: Cypher.Environment) => {
        const variableCypher = compileCypher(variable, env);
        const paramName = `${variableCypher}_${field.fieldName}_${field.callback?.callbackName}`;

        callbackBucket.addCallback({
            functionName: field.callback?.callbackName as string,
            paramName,
            parent,
            type: field.typeMeta,
        });

        return [`$resolvedCallbacks.${paramName}`, {}];
    });

    return [propRef, rawCypherStatement];
};
