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

import { GraphQLWhereArg, Context } from "../types";
import { Node, Relationship } from "../classes";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";

interface Res {
    clauses: string[];
    params: any;
}

function createWhereAndParams({
    whereInput,
    varName,
    chainStr,
    node,
    context,
    recursing,
}: {
    node: Node;
    context: Context;
    whereInput: GraphQLWhereArg;
    varName: string;
    chainStr?: string;
    recursing?: boolean;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        let param = "";
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${varName}_${key}`;
        }

        const pointField = node.pointFields.find((x) => key.startsWith(x.fieldName));

        if (key.endsWith("_NOT")) {
            const [fieldName] = key.split("_NOT");
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);
            const connectionField = node.connectionFields.find((x) => fieldName === x.fieldName);

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

                if (value === null) {
                    res.clauses.push(
                        `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`
                    );
                    return res;
                }

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND NONE(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE `,
                ].join(" ");

                const recurse = createWhereAndParams({
                    whereInput: value,
                    varName: param,
                    chainStr: param,
                    node: refNode,
                    context,
                    recursing: true,
                });

                resultStr += recurse[0];
                resultStr += ")"; // close ALL
                res.clauses.push(resultStr);
                res.params = { ...res.params, ...recurse[1] };
                return res;
            }

            if (connectionField) {
                const refNode = context.neoSchema.nodes.find(
                    (x) => x.name === connectionField.relationship.typeMeta.name
                ) as Node;
                const relationship = context.neoSchema.relationships.find(
                    (x) => x.name === connectionField.relationshipTypeName
                ) as Relationship;

                const relationshipVariable = `${param}_${connectionField.relationshipTypeName}`;

                const inStr = connectionField.relationship.direction === "IN" ? "<-" : "-";
                const outStr = connectionField.relationship.direction === "OUT" ? "->" : "-";

                if (value === null) {
                    res.clauses.push(
                        `EXISTS((${varName})${inStr}[:${connectionField.relationship.type}]${outStr}(:${connectionField.relationship.typeMeta.name}))`
                    );
                    return res;
                }

                const collectedMap = `${param}_map`;

                let resultStr = [
                    `EXISTS((${varName})${inStr}[:${connectionField.relationship.type}]${outStr}(:${connectionField.relationship.typeMeta.name}))`,
                    `AND NONE(${collectedMap} IN [(${varName})${inStr}[${relationshipVariable}:${connectionField.relationship.type}]${outStr}(${param}:${connectionField.relationship.typeMeta.name})`,
                    ` | { node: ${param}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
                ].join(" ");

                const connectionWhere = createConnectionWhereAndParams({
                    whereInput: value,
                    context,
                    node: refNode,
                    nodeVariable: `${collectedMap}.node`,
                    relationship,
                    relationshipVariable: `${collectedMap}.relationship`,
                    parameterPrefix: `${varName}_${context.resolveTree.name}.where.${key}`,
                });

                resultStr += connectionWhere[0];
                resultStr += ")"; // close ALL
                res.clauses.push(resultStr);
                res.params = {
                    ...res.params,
                    ...(recursing
                        ? {
                              [`${varName}_${context.resolveTree.name}`]: {
                                  where: { [`${connectionField.fieldName}_NOT`]: connectionWhere[1] },
                              },
                          }
                        : { [`${varName}_${context.resolveTree.name}`]: context.resolveTree.args }),
                };
                return res;
            }

            if (value === null) {
                res.clauses.push(`${varName}.${fieldName} IS NOT NULL`);
                return res;
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    res.clauses.push(`(NOT ${varName}.${fieldName} = [p in $${param} | point(p)])`);
                } else {
                    res.clauses.push(`(NOT ${varName}.${fieldName} = point($${param}))`);
                }
            } else {
                res.clauses.push(`(NOT ${property} = $${param})`);
            }

            res.params[param] = value;
            return res;
        }

        if (key.endsWith("_NOT_IN")) {
            const [fieldName] = key.split("_NOT_IN");
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE NOT(`,
                ].join(" ");

                const inner: string[] = [];

                (value as any[]).forEach((v, i) => {
                    const recurse = createWhereAndParams({
                        whereInput: v,
                        varName: param,
                        chainStr: `${param}${i}`,
                        node: refNode,
                        context,
                        recursing: true,
                    });

                    inner.push(recurse[0]);
                    res.params = { ...res.params, ...recurse[1] };
                });

                resultStr += inner.join(" OR ");
                resultStr += ")"; // close NOT
                resultStr += ")"; // close ALL
                res.clauses.push(resultStr);
            } else if (pointField) {
                res.clauses.push(`(NOT ${varName}.${fieldName} IN [p in $${param} | point(p)])`);
                res.params[param] = value;
            } else {
                res.clauses.push(`(NOT ${property} IN $${param})`);
                res.params[param] = value;
            }

            return res;
        }

        if (key.endsWith("_IN")) {
            const [fieldName] = key.split("_IN");
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE `,
                ].join(" ");

                const inner: string[] = [];

                (value as any[]).forEach((v, i) => {
                    const recurse = createWhereAndParams({
                        whereInput: v,
                        varName: param,
                        chainStr: `${param}${i}`,
                        node: refNode,
                        context,
                        recursing: true,
                    });

                    inner.push(recurse[0]);
                    res.params = { ...res.params, ...recurse[1] };
                });

                resultStr += inner.join(" OR ");
                resultStr += ")"; // close ALL
                res.clauses.push(resultStr);
            } else if (pointField) {
                res.clauses.push(`${varName}.${fieldName} IN [p in $${param} | point(p)]`);
                res.params[param] = value;
            } else {
                res.clauses.push(`${property} IN $${param}`);
                res.params[param] = value;
            }

            return res;
        }

        if (key.endsWith("_NOT_INCLUDES")) {
            const [fieldName] = key.split("_NOT_INCLUDES");

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            if (pointField) {
                res.clauses.push(`(NOT point($${param}) IN ${varName}.${fieldName})`);
                res.params[param] = value;
            } else {
                res.clauses.push(`(NOT $${param} IN ${property})`);
                res.params[param] = value;
            }

            return res;
        }

        if (key.endsWith("_INCLUDES")) {
            const [fieldName] = key.split("_INCLUDES");

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            if (pointField) {
                res.clauses.push(`point($${param}) IN ${varName}.${fieldName}`);
                res.params[param] = value;
            } else {
                res.clauses.push(`$${param} IN ${property}`);
                res.params[param] = value;
            }

            return res;
        }

        const equalityRelation = node.relationFields.find((x) => key === x.fieldName);
        if (equalityRelation) {
            const refNode = context.neoSchema.nodes.find((x) => x.name === equalityRelation.typeMeta.name) as Node;
            const inStr = equalityRelation.direction === "IN" ? "<-" : "-";
            const outStr = equalityRelation.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${equalityRelation.type}]`;

            if (value === null) {
                res.clauses.push(
                    `NOT EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${equalityRelation.typeMeta.name}))`
                );
                return res;
            }

            let resultStr = [
                `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${equalityRelation.typeMeta.name}))`,
                `AND ANY(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${equalityRelation.typeMeta.name}) | ${param}] INNER_WHERE `,
            ].join(" ");

            const recurse = createWhereAndParams({
                whereInput: value,
                varName: param,
                chainStr: param,
                node: refNode,
                context,
                recursing: true,
            });

            resultStr += recurse[0];
            resultStr += ")"; // close ANY
            res.clauses.push(resultStr);
            res.params = { ...res.params, ...recurse[1] };
            return res;
        }

        const equalityConnection = node.connectionFields?.find((x) => key === x.fieldName);
        if (equalityConnection) {
            const refNode = context.neoSchema.nodes.find(
                (x) => x.name === equalityConnection.relationship.typeMeta.name
            ) as Node;
            const relationship = context.neoSchema.relationships.find(
                (x) => x.name === equalityConnection.relationshipTypeName
            ) as Relationship;

            const relationshipVariable = `${param}_${equalityConnection.relationshipTypeName}`;

            const inStr = equalityConnection.relationship.direction === "IN" ? "<-" : "-";
            const outStr = equalityConnection.relationship.direction === "OUT" ? "->" : "-";

            if (value === null) {
                res.clauses.push(
                    `NOT EXISTS((${varName})${inStr}[:${equalityConnection.relationship.type}]${outStr}(:${equalityConnection.typeMeta.name}))`
                );
                return res;
            }

            const collectedMap = `${param}_map`;

            let resultStr = [
                `EXISTS((${varName})${inStr}[:${equalityConnection.relationship.type}]${outStr}(:${equalityConnection.relationship.typeMeta.name}))`,
                `AND ANY(${collectedMap} IN [(${varName})${inStr}[${relationshipVariable}:${equalityConnection.relationship.type}]${outStr}(${param}:${equalityConnection.relationship.typeMeta.name})`,
                ` | { node: ${param}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
            ].join(" ");

            const connectionWhere = createConnectionWhereAndParams({
                whereInput: value,
                context,
                node: refNode,
                nodeVariable: `${collectedMap}.node`,
                relationship,
                relationshipVariable: `${collectedMap}.relationship`,
                parameterPrefix: `${varName}_${context.resolveTree.name}.where.${key}`,
            });

            resultStr += connectionWhere[0];
            resultStr += ")"; // close ALL
            res.clauses.push(resultStr);
            res.params = {
                ...res.params,
                ...(recursing
                    ? {
                          [`${varName}_${context.resolveTree.name}`]: {
                              where: { [equalityConnection.fieldName]: connectionWhere[1] },
                          },
                      }
                    : { [`${varName}_${context.resolveTree.name}`]: context.resolveTree.args }),
            };
            return res;
        }

        if (key.endsWith("_MATCHES")) {
            const [fieldName] = key.split("_MATCHES");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`${property} =~ $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_NOT_CONTAINS")) {
            const [fieldName] = key.split("_NOT_CONTAINS");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`(NOT ${property} CONTAINS $${param})`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_CONTAINS")) {
            const [fieldName] = key.split("_CONTAINS");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`${property} CONTAINS $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_NOT_STARTS_WITH")) {
            const [fieldName] = key.split("_NOT_STARTS_WITH");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`(NOT ${property} STARTS WITH $${param})`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_STARTS_WITH")) {
            const [fieldName] = key.split("_STARTS_WITH");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`${property} STARTS WITH $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_NOT_ENDS_WITH")) {
            const [fieldName] = key.split("_NOT_ENDS_WITH");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`(NOT ${property} ENDS WITH $${param})`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_ENDS_WITH")) {
            const [fieldName] = key.split("_ENDS_WITH");

            const coalesceValue = node.primitiveFields.find((f) => fieldName === f.fieldName)?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(`${property} ENDS WITH $${param}`);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_LT")) {
            const [fieldName] = key.split("_LT");

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(
                pointField
                    ? `distance(${varName}.${fieldName}, point($${param}.point)) < $${param}.distance`
                    : `${property} < $${param}`
            );
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_LTE")) {
            const [fieldName] = key.split("_LTE");

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(
                pointField
                    ? `distance(${varName}.${fieldName}, point($${param}.point)) <= $${param}.distance`
                    : `${property} <= $${param}`
            );
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_GT")) {
            const [fieldName] = key.split("_GT");

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(
                pointField
                    ? `distance(${varName}.${fieldName}, point($${param}.point)) > $${param}.distance`
                    : `${property} > $${param}`
            );
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_GTE")) {
            const [fieldName] = key.split("_GTE");

            const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
                (f) => fieldName === f.fieldName
            )?.coalesceValue;
            const property =
                coalesceValue !== undefined
                    ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                    : `${varName}.${fieldName}`;

            res.clauses.push(
                pointField
                    ? `distance(${varName}.${fieldName}, point($${param}.point)) >= $${param}.distance`
                    : `${property} >= $${param}`
            );
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_DISTANCE")) {
            const [fieldName] = key.split("_DISTANCE");
            res.clauses.push(`distance(${varName}.${fieldName}, point($${param}.point)) = $${param}.distance`);
            res.params[param] = value;

            return res;
        }

        if (["AND", "OR"].includes(key)) {
            const innerClauses: string[] = [];

            value.forEach((v: any, i) => {
                const recurse = createWhereAndParams({
                    whereInput: v,
                    varName,
                    chainStr: `${param}${i > 0 ? i : ""}`,
                    node,
                    context,
                    recursing: true,
                });
                if (recurse[0]) {
                    innerClauses.push(`${recurse[0]}`);
                    res.params = { ...res.params, ...recurse[1] };
                }
            });

            if (innerClauses.length) {
                res.clauses.push(`(${innerClauses.join(` ${key} `)})`);
            }

            return res;
        }

        if (value === null) {
            res.clauses.push(`${varName}.${key} IS NULL`);
            return res;
        }

        if (pointField) {
            if (pointField.typeMeta.array) {
                res.clauses.push(`${varName}.${key} = [p in $${param} | point(p)]`);
            } else {
                res.clauses.push(`${varName}.${key} = point($${param})`);
            }
        } else {
            const field = [...node.primitiveFields, ...node.dateTimeFields].find((f) => key === f.fieldName);
            const property =
                field?.coalesceValue !== undefined
                    ? `coalesce(${varName}.${field.fieldName}, ${field.coalesceValue})`
                    : `${varName}.${key}`;

            res.clauses.push(`${property} = $${param}`);
        }

        res.params[param] = value;
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    let where = `${!recursing ? "WHERE " : ""}`;
    where += clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createWhereAndParams;
