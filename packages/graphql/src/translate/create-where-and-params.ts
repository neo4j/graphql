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
import { Node } from "../classes";

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

        const re = /(?<field>[_A-Za-z][_0-9A-Za-z]*?)(?:_(?<not>NOT))?(?:_(?<operator>INCLUDES|IN|MATCHES|CONTAINS|STARTS_WITH|ENDS_WITH|LT|GT|GTE|LTE|DISTANCE))?$/gm;

        const match = re.exec(key);

        const fieldName = match?.groups?.field;
        const not = !!match?.groups?.not;
        const operator = match?.groups?.operator;

        const coalesceValue = [...node.primitiveFields, ...node.dateTimeFields].find(
            (f) => match?.groups?.field === f.fieldName
        )?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                : `${varName}.${fieldName}`;

        if (fieldName && ["AND", "OR"].includes(fieldName)) {
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

                innerClauses.push(`${recurse[0]}`);
                res.params = { ...res.params, ...recurse[1] };
            });

            res.clauses.push(`(${innerClauses.join(` ${key} `)})`);

            return res;
        }

        // Equality/inequality
        if (!operator) {
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

                if (value === null) {
                    let clause = `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`;
                    if (!not) clause = `NOT ${clause}`;
                    res.clauses.push(clause);
                    return res;
                }

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ${not ? "NONE" : "ANY"}(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${
                        relationField.typeMeta.name
                    }) | ${param}] INNER_WHERE `,
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
                resultStr += ")"; // close NONE/ANY
                res.clauses.push(resultStr);
                res.params = { ...res.params, ...recurse[1] };
                return res;
            }

            if (value === null) {
                res.clauses.push(not ? `${varName}.${fieldName} IS NOT NULL` : `${varName}.${fieldName} IS NULL`);
                return res;
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    let clause = `${varName}.${fieldName} = [p in $${param} | point(p)]`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                } else {
                    let clause = `${varName}.${fieldName} = point($${param})`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                }
            } else {
                let clause = `${property} = $${param}`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
            }

            res.params[param] = value;
            return res;
        }

        if (operator === "IN") {
            const relationField = node.relationFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ALL(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}:${relationField.typeMeta.name}) | ${param}] INNER_WHERE `,
                ].join(" ");

                if (not) resultStr += "NOT(";

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
                if (not) resultStr += ")"; // close NOT
                resultStr += ")"; // close ALL
                res.clauses.push(resultStr);
            } else if (pointField) {
                let clause = `${varName}.${fieldName} IN [p in $${param} | point(p)]`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
                res.params[param] = value;
            } else {
                let clause = `${property} IN $${param}`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
                res.params[param] = value;
            }

            return res;
        }

        if (operator === "INCLUDES") {
            let clause = pointField ? `point($${param}) IN ${varName}.${fieldName}` : `$${param} IN ${property}`;

            if (not) clause = `(NOT ${clause})`;

            res.clauses.push(clause);
            res.params[param] = value;

            return res;
        }

        if (key.endsWith("_MATCHES")) {
            res.clauses.push(`${property} =~ $${param}`);
            res.params[param] = value;

            return res;
        }

        if (operator && ["CONTAINS", "STARTS_WITH", "ENDS_WITH"].includes(operator)) {
            let clause = `${property} ${operators[operator]} $${param}`;
            if (not) clause = `(NOT ${clause})`;
            res.clauses.push(clause);
            res.params[param] = value;
            return res;
        }

        if (operator && ["LT", "LTE", "GTE", "GT"].includes(operator)) {
            res.clauses.push(
                pointField
                    ? `distance(${varName}.${fieldName}, point($${param}.point)) ${operators[operator]} $${param}.distance`
                    : `${property} ${operators[operator]} $${param}`
            );
            res.params[param] = value;
            return res;
        }

        if (key.endsWith("_DISTANCE")) {
            res.clauses.push(`distance(${varName}.${fieldName}, point($${param}.point)) = $${param}.distance`);
            res.params[param] = value;

            return res;
        }

        // Necessary for TypeScript, but should never reach here
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    let where = `${!recursing ? "WHERE " : ""}`;
    where += clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createWhereAndParams;
