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
import { Node, Relationship } from "../../classes";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import mapToDbProperty from "../../utils/map-to-db-property";
import createAggregateWhereAndParams from "../create-aggregate-where-and-params";
import { createWhereClause, getListPredicate, whereRegEx, WhereRegexGroups } from "./utils";

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

        // Recurse if using AND/OR

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

        const match = whereRegEx.exec(key);

        const { fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;
        const isNot = operator?.startsWith("NOT") ?? false;

        const dbFieldName = mapToDbProperty(node, fieldName);

        const coalesceValue = [...node.primitiveFields, ...node.temporalFields].find((f) => fieldName === f.fieldName)
            ?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${varName}.${dbFieldName}, ${coalesceValue})`
                : `${varName}.${dbFieldName}`;

        // Relationship Field

        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (isAggregate) {
            if (!relationField) throw new Error("Aggregate filters must be on relationship fields");
            const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relationship = context.neoSchema.relationships.find(
                (x) => x.properties === relationField.properties
            ) as Relationship;

            const aggregateWhereAndParams = createAggregateWhereAndParams({
                node: refNode,
                chainStr: param,
                context,
                field: relationField,
                varName,
                aggregation: value,
                relationship,
            });
            if (aggregateWhereAndParams[0]) {
                res.clauses.push(aggregateWhereAndParams[0]);
                res.params = { ...res.params, ...aggregateWhereAndParams[1] };
            }

            return res;
        }

        const listPredicate = getListPredicate(operator);

        if (relationField) {
            const refNode = context.neoSchema.nodes.find((n) => n.name === relationField.typeMeta.name);
            if (!refNode) throw new Error("Relationship filters must reference nodes");
            const labels = refNode.getLabelString(context);

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            if (value === null) {
                res.clauses.push(`${isNot ? "" : "NOT "}EXISTS((${varName})${inStr}${relTypeStr}${outStr}(${labels}))`);
                return res;
            }

            let resultStr = [
                `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(${labels}))`,
                `AND ${listPredicate}(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}${labels}) | ${param}] INNER_WHERE `,
            ].join(" ");

            const recurse = createWhereAndParams({
                whereInput: value,
                varName: param,
                chainStr: param,
                node: refNode,
                context,
                recursing: true,
            });

            if (recurse[0]) {
                resultStr += recurse[0];
                resultStr += ")"; // close predicate
                res.clauses.push(resultStr);
                res.params = { ...res.params, ...recurse[1] };
            }

            return res;
        }

        // Connection Field

        const connectionField = node.connectionFields.find((x) => x.fieldName === fieldName);

        if (connectionField) {
            let nodeEntries: Record<string, any> = value;

            if (!connectionField?.relationship.union) {
                nodeEntries = { [connectionField.relationship.typeMeta.name]: value };
            }

            Object.entries(nodeEntries).forEach((entry) => {
                const refNode = context.neoSchema.nodes.find((x) => x.name === entry[0]) as Node;
                const relationship = context.neoSchema.relationships.find(
                    (x) => x.name === connectionField.relationshipTypeName
                ) as Relationship;

                const thisParam = `${param}_${refNode.name}`;
                const relationshipVariable = `${thisParam}_${connectionField.relationshipTypeName}`;
                const inStr = connectionField.relationship.direction === "IN" ? "<-" : "-";
                const outStr = connectionField.relationship.direction === "OUT" ? "->" : "-";
                const labels = refNode.getLabelString(context);
                const collectedMap = `${thisParam}_map`;

                if (value === null) {
                    res.clauses.push(
                        `${isNot ? "" : "NOT "}EXISTS((${varName})${inStr}[:${
                            connectionField.relationship.type
                        }]${outStr}(${labels}))`
                    );
                    return res;
                }

                let resultStr = [
                    `EXISTS((${varName})${inStr}[:${connectionField.relationship.type}]${outStr}(${labels}))`,
                    `AND ${listPredicate}(${collectedMap} IN [(${varName})${inStr}[${relationshipVariable}:${connectionField.relationship.type}]${outStr}(${thisParam}${labels})`,
                    ` | { node: ${thisParam}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
                ].join(" ");

                const connectionWhere = createConnectionWhereAndParams({
                    whereInput: entry[1] as any,
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

                const whereKeySuffix = isNot ? "_NOT" : "";
                const resolveTreeParams = recursing
                    ? {
                          [`${varName}_${context.resolveTree.name}`]: {
                              where: { [`${connectionField.fieldName}${whereKeySuffix}`]: connectionWhere[1] },
                          },
                      }
                    : { [`${varName}_${context.resolveTree.name}`]: context.resolveTree.args };

                res.params = {
                    ...res.params,
                    ...resolveTreeParams,
                };
            });

            return res;
        }

        if (value === null) {
            res.clauses.push(`${property} ${isNot ? "IS NOT" : "IS"} NULL`);
            return res;
        }

        const pointField = node.pointFields.find((x) => x.fieldName === fieldName);

        const durationField = node.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );

        res.clauses.push(createWhereClause({ param, property, operator, isNot, pointField, durationField }));

        res.params[param] = value;
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    let where = `${!recursing ? "WHERE " : ""}`;
    where += clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createWhereAndParams;
