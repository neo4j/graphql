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

import { GraphQLWhereArg, Context, ConnectionWhereArg } from "../../types";
import { Node, Relationship } from "../../classes";
import createFilter from "./create-filter";
import mapToDbProperty from "../../utils/map-to-db-property";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import { wrapInApocRunFirstColumn } from "../utils/apoc-run";

interface Res {
    clauses: string[];
    params: any;
}

function createNodeWhereAndParams({
    whereInput,
    node,
    nodeVariable,
    context,
    parameterPrefix,
}: {
    whereInput: GraphQLWhereArg;
    node: Node;
    nodeVariable: string;
    context: Context;
    parameterPrefix: string;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        const param = `${parameterPrefix}.${key}`;

        const operators = {
            INCLUDES: "IN",
            IN: "IN",
            MATCHES: "=~",
            CONTAINS: "CONTAINS",
            STARTS_WITH: "STARTS WITH",
            ENDS_WITH: "ENDS WITH",
            LT: "<",
            GT: ">",
            GTE: ">=",
            LTE: "<=",
            DISTANCE: "=",
        };

        const re =
            /(?<field>[_A-Za-z][_0-9A-Za-z]*?)(?:_(?<not>NOT))?(?:_(?<operator>INCLUDES|IN|MATCHES|CONTAINS|STARTS_WITH|ENDS_WITH|LT|GT|GTE|LTE|DISTANCE))?$/gm;

        const match = re.exec(key);

        if (!match) {
            throw new Error(`Failed to match key in filter: ${key}`);
        }

        const fieldName = match.groups?.field;

        if (!fieldName) {
            throw new Error(`Failed to find field name in filter: ${key}`);
        }

        const not = !!match.groups?.not;
        const operator = match.groups?.operator;

        const pointField = node.pointFields.find((x) => x.fieldName === fieldName);
        // Comparison operations requires adding dates to durations
        // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
        const durationField = node.scalarFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );
        const dbProperty = mapToDbProperty(node, fieldName);

        const coalesceValue = [...node.primitiveFields, ...node.temporalFields].find(
            (f) => fieldName === f.fieldName
        )?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${nodeVariable}.${dbProperty}, ${coalesceValue})`
                : `${nodeVariable}.${dbProperty}`;
        if (fieldName && ["AND", "OR"].includes(fieldName)) {
            const innerClauses: string[] = [];
            const nestedParams: any[] = [];

            value.forEach((v: any, i) => {
                const recurse = createNodeWhereAndParams({
                    whereInput: v,
                    node,
                    nodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${fieldName}[${i}]`,
                });

                innerClauses.push(`(${recurse[0]})`);
                nestedParams.push(recurse[1]);
            });

            res.clauses.push(`(${innerClauses.join(` ${fieldName} `)})`);
            res.params = { ...res.params, [fieldName]: nestedParams };

            return res;
        }

        // Equality/inequality
        if (!operator) {
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);
            const connectionField = node.connectionFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;
                const relatedNodeVariable = `${nodeVariable}_${relationField.fieldName}`;
                const labels = refNode.getLabelString(context);

                if (value === null) {
                    let clause = `EXISTS((${nodeVariable})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`;
                    if (!not) clause = `NOT ${clause}`;
                    res.clauses.push(clause);
                    return res;
                }

                let resultStr = [
                    `EXISTS((${nodeVariable})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ${
                        not ? "NONE" : "ANY"
                    }(${relatedNodeVariable} IN [(${nodeVariable})${inStr}${relTypeStr}${outStr}(${relatedNodeVariable}${labels}) | ${relatedNodeVariable}] INNER_WHERE `,
                ].join(" ");

                const recurse = createNodeWhereAndParams({
                    whereInput: value,
                    node: refNode,
                    nodeVariable: relatedNodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${fieldName}`,
                });

                resultStr += recurse[0];
                resultStr += ")"; // close NONE/ANY
                res.clauses.push(resultStr);
                res.params = { ...res.params, [fieldName]: recurse[1] };
                return res;
            }

            if (connectionField) {
                let nodeEntries: Record<string, ConnectionWhereArg> = value;

                if (!connectionField?.relationship.union) {
                    nodeEntries = { [connectionField.relationship.typeMeta.name]: value };
                }

                Object.entries(nodeEntries).forEach((entry) => {
                    const refNode = context.nodes.find((x) => x.name === entry[0]) as Node;
                    const relationship = context.relationships.find(
                        (x) => x.name === connectionField.relationshipTypeName
                    ) as Relationship;

                    const safeNodeVariable = `${nodeVariable.replace(/\./g, "_")}`;

                    const relatedNodeVariable = `${safeNodeVariable}_${refNode.name}`;

                    const inStr = connectionField.relationship.direction === "IN" ? "<-" : "-";
                    const relationshipVariable = `${relatedNodeVariable}_${connectionField.relationshipTypeName}`;
                    const outStr = connectionField.relationship.direction === "OUT" ? "->" : "-";
                    const labels = refNode.getLabelString(context);

                    const collectedMap = `${relatedNodeVariable}_map`;

                    const rootParam = parameterPrefix.split(".", 1)[0];

                    const existsStr = `EXISTS((${safeNodeVariable})${inStr}[:${connectionField.relationship.type}]${outStr}(${labels}))`;

                    if (value === null) {
                        res.clauses.push(not ? `NOT ${existsStr}` : existsStr);
                        return;
                    }

                    const resultArr = [
                        `RETURN ${existsStr}`,
                        `AND ${
                            not ? "NONE" : "ANY"
                        }(${collectedMap} IN [(${safeNodeVariable})${inStr}[${relationshipVariable}:${
                            connectionField.relationship.type
                        }]${outStr}(${relatedNodeVariable}${labels}) | { node: ${relatedNodeVariable}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
                    ];

                    const connectionWhere = createConnectionWhereAndParams({
                        whereInput: entry[1],
                        context,
                        node: refNode,
                        nodeVariable: `${collectedMap}.node`,
                        relationship,
                        relationshipVariable: `${collectedMap}.relationship`,
                        parameterPrefix: `${parameterPrefix}.${fieldName}`,
                    });

                    resultArr.push(connectionWhere[0]);
                    resultArr.push(")"); // close NONE/ANY

                    const apocRunFirstColumn = wrapInApocRunFirstColumn(resultArr.join("\n"), {
                        [safeNodeVariable]: nodeVariable,
                        [rootParam]: `$${rootParam}`,
                    });

                    res.clauses.push(apocRunFirstColumn);

                    res.params = { ...res.params, [fieldName]: connectionWhere[1] };
                });

                return res;
            }

            if (value === null) {
                res.clauses.push(not ? `${property} IS NOT NULL` : `${property} IS NULL`);
                return res;
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    let clause = `${property} = [p in $${param} | point(p)]`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                } else {
                    let clause = `${property} = point($${param})`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                }
            } else {
                let clause = `${property} = $${param}`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
            }

            res.params[key] = value;
            return res;
        }

        if (operator === "IN") {
            const clause = createFilter({
                left: property,
                operator,
                right: pointField ? `[p in $${param} | point(p)]` : `$${param}`,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (operator === "INCLUDES") {
            let clause = pointField ? `point($${param}) IN ${property}` : `$${param} IN ${property}`;

            if (not) clause = `(NOT ${clause})`;

            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (key.endsWith("_MATCHES")) {
            res.clauses.push(`${property} =~ $${param}`);
            res.params[key] = value;

            return res;
        }

        if (operator && ["CONTAINS", "STARTS_WITH", "ENDS_WITH"].includes(operator)) {
            let clause = `${property} ${operators[operator]} $${param}`;
            if (not) clause = `(NOT ${clause})`;
            res.clauses.push(clause);
            res.params[key] = value;
            return res;
        }

        if (operator && ["LT", "LTE", "GTE", "GT"].includes(operator)) {
            let clause = `${property} ${operators[operator]} $${param}`;

            if (pointField) {
                clause = `distance(${property}, point($${param}.point)) ${operators[operator]} $${param}.distance`;
            }

            if (durationField) {
                clause = `datetime() + ${property} ${operators[operator]} datetime() + $${param}`;
            }

            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (key.endsWith("_DISTANCE")) {
            res.clauses.push(`distance(${property}, point($${param}.point)) = $${param}.distance`);
            res.params[key] = value;

            return res;
        }

        // Necessary for TypeScript, but should never reach here
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    const where = clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createNodeWhereAndParams;
