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

import { Neo4jGraphQLError, type Node, type Relationship } from "../../classes";
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
    isUpdateOperation = false,
}: {
    nodeOrRel: Node | Relationship;
    param: string;
    key: string;
    varName: string;
    value: any;
    withVars: string[];
    isUpdateOperation?: boolean;
}): string {
    const strs: string[] = [];
    const { settableField, operator } = parseMutableField(nodeOrRel, key);
    if (!operator && isUpdateOperation) {
        const result = getMutationFieldStatementsForGenericOperator({
            nodeOrRel,
            param,
            key,
            varName,
            operations: value,
            withVars,
        });
        return result;
    }

    if (settableField) {
        const dbFieldName = mapToDbProperty(nodeOrRel, settableField.fieldName);
        if (settableField.typeMeta.required && value === null) {
            throw new Error(`Cannot set non-nullable field ${nodeOrRel.name}.${settableField.fieldName} to null`);
        }

        switch (operator ?? "SET") {
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

// Converts generic operator into cypher statements using the deprecated syntax as intermediate step
function getMutationFieldStatementsForGenericOperator({
    nodeOrRel,
    param,
    key,
    varName,
    operations,
    withVars,
}: {
    nodeOrRel: Node | Relationship;
    param: string;
    key: string;
    varName: string;
    operations: any;
    withVars: string[];
}): string {
    if (Object.entries(operations).length > 1) {
        throw new Neo4jGraphQLError(
            `Conflicting modification of field ${key}: ${Object.keys(operations)
                .map((n) => `[[${n}]]`)
                .join(", ")} on type ${nodeOrRel.name}`
        );
    }

    return Object.entries(operations)
        .map(([operator, value]) => {
            return getMutationFieldStatements({
                nodeOrRel,
                param: `${param}.${operator}`,
                key: `${key}_${newOperatorToDeprecated(operator)}`,
                varName,
                withVars,
                value,
            });
        })
        .join("\n");
}

function newOperatorToDeprecated(op: string): string {
    switch (op) {
        case "set":
            return "SET";
        case "increment":
            return "INCREMENT";
        case "decrement":
            return "DECREMENT";
        case "add":
            return "ADD";
        case "subtract":
            return "SUBTRACT";
        case "divide":
            return "DIVIDE";
        case "multiply":
            return "MULTIPLY";
        case "push":
            return "PUSH";
        case "pop":
            return "POP";
        default:
            throw new Error(`Unknown generic mutation operator ${op}`);
    }
}
