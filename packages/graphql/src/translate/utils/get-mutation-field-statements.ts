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

import type { Node, Relationship } from "../../classes";
import { SPATIAL_TYPES } from "../../constants";
import mapToDbProperty from "../../utils/map-to-db-property";
import { buildMathStatements, matchMathField, mathDescriptorBuilder } from "./math";
import { parseMutableField } from "./parse-mutable-field";

/**
 * Transforms a key-value pair such as:
 * { name_SET: "John" }
 * Into statements such as:
 * SET node.name = $param
 **/
export function getMutationFieldStatements({
    nodeOrRel,
    param,
    key,
    varName,
    value,
    withVars,
}: {
    nodeOrRel: Node | Relationship;
    param: string;
    key: string;
    varName: string;
    value: any;
    withVars: string[];
}): string {
    const strs: string[] = [];
    const { settableField, operator } = parseMutableField(nodeOrRel, key);
    if (settableField) {
        const dbFieldName = mapToDbProperty(nodeOrRel, settableField.fieldName);
        if (settableField.typeMeta.required && value === null) {
            throw new Error(`Cannot set non-nullable field ${nodeOrRel.name}.${settableField.fieldName} to null`);
        }

        switch (operator) {
            case "SET": {
                const isSpatial = SPATIAL_TYPES.includes(settableField.typeMeta.name);
                const isZonedTemporal = ["DateTime", "Time"].includes(settableField.typeMeta.name);
                if (isSpatial) {
                    if (settableField.typeMeta.array) {
                        strs.push(`SET ${varName}.${dbFieldName} = [p in $${param} | point(p)]`);
                    } else {
                        strs.push(`SET ${varName}.${dbFieldName} = point($${param})`);
                    }
                } else if (isZonedTemporal) {
                    if (settableField.typeMeta.array) {
                        strs.push(
                            `SET ${varName}.${dbFieldName} = [t in $${param} | ${settableField.typeMeta.name.toLowerCase()}(t)]`
                        );
                    } else {
                        strs.push(
                            `SET ${varName}.${dbFieldName} = ${settableField.typeMeta.name.toLowerCase()}($${param})`
                        );
                    }
                } else {
                    strs.push(`SET ${varName}.${dbFieldName} = $${param}`);
                }

                break;
            }
            case "INCREMENT":
            case "DECREMENT":
            case "ADD":
            case "SUBTRACT":
            case "DIVIDE":
            case "MULTIPLY": {
                const mathMatch = matchMathField(key);
                const mathDescriptor = mathDescriptorBuilder(value as number, nodeOrRel, mathMatch);
                const mathStatements = buildMathStatements(mathDescriptor, varName, withVars, param);
                strs.push(...mathStatements);
                break;
            }
            case "PUSH": {
                const pointArrayField = nodeOrRel.pointFields.find((x) => x.fieldName === settableField.fieldName);
                const zonedTemporalArrayField = nodeOrRel.temporalFields.find(
                    (x) =>
                        x.fieldName === settableField.fieldName &&
                        ["DateTime", "Time"].includes(settableField.typeMeta.name)
                );

                if (pointArrayField) {
                    strs.push(
                        `SET ${varName}.${dbFieldName} = ${varName}.${dbFieldName} + [p in $${param} | point(p)]`
                    );
                } else if (zonedTemporalArrayField) {
                    strs.push(
                        `SET ${varName}.${dbFieldName} = ${varName}.${dbFieldName} + [t in $${param} | ${settableField.typeMeta.name.toLowerCase()}(t)]`
                    );
                } else {
                    strs.push(`SET ${varName}.${dbFieldName} = ${varName}.${dbFieldName} + $${param}`);
                }

                break;
            }
            case "POP": {
                strs.push(`SET ${varName}.${dbFieldName} = ${varName}.${dbFieldName}[0..-$${param}]`);
                break;
            }
        }
    }
    return strs.join("\n");
}
