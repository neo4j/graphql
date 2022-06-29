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

import { GraphQLWhereArg, ConnectionWhereArg, Context } from "../../types";
import { GraphElement, Node, Relationship } from "../../classes";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import createWhereClause from "./create-where-clause";
import { whereRegEx, WhereRegexGroups, getListPredicate, ListPredicate } from "./utils";
import { wrapInApocRunFirstColumn } from "../utils/apoc-run";
import mapToDbProperty from "../../utils/map-to-db-property";

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
    listPredicates,
}: {
    whereInput: GraphQLWhereArg;
    element: GraphElement;
    varName: string;
    context: Context;
    parameterPrefix: string;
    listPredicates?: ListPredicate[];
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        const param = `${parameterPrefix}.${key}`;

        const match = whereRegEx.exec(key);
        if (!match) {
            throw new Error(`Failed to match key in filter: ${key}`);
        }

        const { fieldName, operator } = match.groups as WhereRegexGroups;

        if (!fieldName) {
            throw new Error(`Failed to find field name in filter: ${key}`);
        }

        const isNot = operator?.startsWith("NOT") ?? false;

        const dbProperty = mapToDbProperty(element, fieldName);

        const coalesceValue = [...element.primitiveFields, ...element.temporalFields, ...element.enumFields].find(
            (f) => fieldName === f.fieldName
        )?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${varName}.${dbProperty}, ${coalesceValue})`
                : `${varName}.${dbProperty}`;

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
                const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
                const inStr = relationField.direction === "IN" ? "<-" : "-";
                const outStr = relationField.direction === "OUT" ? "->" : "-";
                const relTypeStr = `[:${relationField.type}]`;
                const relatedNodeVariable = `${varName}_${relationField.fieldName}`;
                const labels = refNode.getLabelString(context);

                if (value === null) {
                    res.clauses.push(
                        `${isNot ? "" : "NOT "}exists((${varName})${inStr}${relTypeStr}${outStr}(:${
                            relationField.typeMeta.name
                        }))`
                    );
                    return res;
                }

                let resultStr = [
                    `exists((${varName})${inStr}${relTypeStr}${outStr}(:${relationField.typeMeta.name}))`,
                    `AND ${getListPredicate(
                        operator
                    )}(${relatedNodeVariable} IN [(${varName})${inStr}${relTypeStr}${outStr}(${relatedNodeVariable}${labels}) | ${relatedNodeVariable}] INNER_WHERE `,
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
            const connectionField = element.connectionFields.find((x) => fieldName === x.fieldName);

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

                    const safeNodeVariable = `${varName.replace(/\./g, "_")}`;

                    const relatedNodeVariable = `${safeNodeVariable}_${refNode.name}`;

                    const inStr = connectionField.relationship.direction === "IN" ? "<-" : "-";
                    const relationshipVariable = `${relatedNodeVariable}_${connectionField.relationshipTypeName}`;
                    const outStr = connectionField.relationship.direction === "OUT" ? "->" : "-";
                    const labels = refNode.getLabelString(context);

                    const collectedMap = `${relatedNodeVariable}_map`;

                    const rootParam = parameterPrefix.split(".", 1)[0];

                    const existsStr = `exists((${safeNodeVariable})${inStr}[:${connectionField.relationship.type}]${outStr}(${labels}))`;

                    if (value === null) {
                        res.clauses.push(isNot ? `NOT ${existsStr}` : existsStr);
                        return;
                    }

                    const hasPreviousSinglePredicate = listPredicates?.length
                        ? listPredicates.includes("single")
                        : null;

                    const currentListPredicate = hasPreviousSinglePredicate ? "single" : getListPredicate(operator);

                    const resultArr = [
                        `RETURN ${existsStr}`,
                        `AND ${currentListPredicate}(${collectedMap} IN [(${safeNodeVariable})${inStr}[${relationshipVariable}:${connectionField.relationship.type}]${outStr}(${relatedNodeVariable}${labels}) | { node: ${relatedNodeVariable}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
                    ];

                    const connectionWhere = createConnectionWhereAndParams({
                        whereInput: entry[1],
                        context,
                        node: refNode,
                        nodeVariable: `${collectedMap}.node`,
                        relationship,
                        relationshipVariable: `${collectedMap}.relationship`,
                        parameterPrefix: `${parameterPrefix}.${fieldName}`,
                        // listPredicates stores all list predicates (SINGLE, ANY, NONE,..) while (recursively) translating the where clauses
                        listPredicates: [currentListPredicate, ...(listPredicates || [])],
                    });

                    resultArr.push(connectionWhere[0]);
                    resultArr.push(")"); // close NONE/ANY

                    const expectMultipleValues = listPredicates?.length ? !listPredicates.includes("single") : true;

                    const apocRunFirstColumn = wrapInApocRunFirstColumn(
                        resultArr.join("\n"),
                        {
                            [safeNodeVariable]: varName,
                            [rootParam]: `$${rootParam}`,
                        },
                        expectMultipleValues
                    );

                    res.clauses.push(apocRunFirstColumn);

                    res.params = { ...res.params, [fieldName]: connectionWhere[1] };
                });

                return res;
            }
        }

        if (value === null) {
            res.clauses.push(`${property} ${isNot ? "IS NOT" : "IS"} NULL`);
            return res;
        }

        const pointField = element.pointFields.find((x) => x.fieldName === fieldName);

        const durationField = element.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );

        res.clauses.push(createWhereClause({ param, property, operator, isNot, pointField, durationField }));

        res.params[key] = value;
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    const where = clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createElementWhereAndParams;
