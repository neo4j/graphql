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

import { GraphQLWhereArg, Context } from "../../types";
import { GraphElement, Node } from "../../classes";
import { whereRegEx, WhereRegexGroups, createWhereClause } from "../utils";

interface Res {
    clauses: string[];
    params: any;
}

function createElementWhereAndParams({
    whereInput,
    element,
    varName,
    context,
    parameterPrefix,
}: {
    whereInput: GraphQLWhereArg;
    element: GraphElement;
    varName: string;
    context: Context;
    parameterPrefix: string;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        const param = `${parameterPrefix}.${key}`;

        const match = whereRegEx.exec(key);

        const { fieldName, not, operator } = match?.groups as WhereRegexGroups;

        const coalesceValue = [...element.primitiveFields, ...element.temporalFields].find(
            (f) => fieldName === f.fieldName
        )?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${varName}.${fieldName}, ${coalesceValue})`
                : `${varName}.${fieldName}`;

        if (["AND", "OR"].includes(fieldName)) {
            const innerClauses: string[] = [];
            const nestedParams: any[] = [];

            value.forEach((v: any, i) => {
                const recurse = createElementWhereAndParams({
                    whereInput: v,
                    element,
                    varName,
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

        if (element instanceof Node) {
            const relationField = element.relationFields.find((x) => fieldName === x.fieldName);

            if (relationField) {
                const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;
                const relatedNodeVariable = `${varName}_${relationField.fieldName}`;

                if (value === null) {
                    res.clauses.push(
                        `${not ? "" : "NOT "}EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${
                            relationField.typeMeta.name
                        }))`
                    );
                    return res;
                }

                let resultStr = [
                    `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ${
                        not ? "NONE" : "ANY"
                    }(${relatedNodeVariable} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relatedNodeVariable}:${
                        relationField.typeMeta.name
                    }) | ${relatedNodeVariable}] INNER_WHERE `,
                ].join(" ");

                const recurse = createElementWhereAndParams({
                    whereInput: value,
                    element: refNode,
                    varName: relatedNodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${fieldName}`,
                });

                resultStr += recurse[0];
                resultStr += ")"; // close NONE/ANY
                res.clauses.push(resultStr);
                res.params = { ...res.params, fieldName: recurse[1] };
                return res;
            }
        }

        if (value === null) {
            res.clauses.push(`${property} ${not ? "IS NOT NULL" : "IS NULL"}`);
            return res;
        }

        const pointField = element.pointFields.find((x) => x.fieldName === fieldName);

        const durationField = element.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );

        res.clauses.push(createWhereClause({ param, property, operator, isNot: !!not, pointField, durationField }));

        res.params[key] = value;
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    const where = clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createElementWhereAndParams;
