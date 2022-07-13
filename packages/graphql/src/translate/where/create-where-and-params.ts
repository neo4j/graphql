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

import { mergeDeep } from "@graphql-tools/utils";
import type { GraphQLWhereArg, Context } from "../../types";
import type { Node, Relationship } from "../../classes";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import mapToDbProperty from "../../utils/map-to-db-property";
import createAggregateWhereAndParams from "../create-aggregate-where-and-params";
import createWhereClause from "./create-where-clause";
import type { WhereRegexGroups } from "./utils";
import { getListPredicate, whereRegEx } from "./utils";
import { listPredicateToClause } from "./list-predicate-to-clause";
import { listPredicateToSizeFunction } from "./list-predicate-to-size-function";
import { createCypherWhereParams } from "./create-cypher-where-params";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";

interface Res {
    clauses: string[];
    params: any;
}

// TODO: change this into using createCypherWhereParams
/** Wraps createCypherWhereParams with the old interface for compatibility with old way of composing cypher */
export default function createWhereAndParams({
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
    const nodeRef = new CypherBuilder.NamedNode(varName);

    const whereParams = createCypherWhereParams({
        node,
        context,
        whereInput,
        targetElement: nodeRef,
    });

    const whereCypher = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        const cypher = whereParams?.getCypher(env) || "";

        return [cypher, {}];
    });

    const result = whereCypher.build(`${chainStr || ""}${varName}_`);
    const whereStr = `${!recursing ? "WHERE " : ""}`;

    return [`${whereStr}${result.cypher}`, result.params];
}

/** TODO: port all uses of this into create-cypher-where-params */
function createWhereAndParamsOld({
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

    function reducer(res: Res, [key, value]: [string, any | GraphQLWhereArg | GraphQLWhereArg[]]): Res {
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
                    res.params = mergeDeep([res.params, recurse[1]]);
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

        const coalesceValue = [...node.primitiveFields, ...node.temporalFields, ...node.enumFields].find(
            (f) => fieldName === f.fieldName
        )?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${varName}.${dbFieldName}, ${coalesceValue})`
                : `${varName}.${dbFieldName}`;

        // Relationship Field

        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (node.isGlobalNode && key === "id") {
            const { field, id } = node.fromGlobalId(value as string);
            param = param.replace(key, field);

            // get the dbField from the returned property fieldName
            const dbField = mapToDbProperty(node, field);
            res.clauses.push(`${varName}.${dbField} = $${param}`);
            res.params = { ...res.params, [param]: id };
            return res;
        }

        if (isAggregate) {
            if (!relationField) throw new Error("Aggregate filters must be on relationship fields");
            const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const relationship = context.relationships.find(
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
            const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
            if (!refNode) throw new Error("Relationship filters must reference nodes");
            const labels = refNode.getLabelString(context);

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            const matchPattern = `(${varName})${inStr}${relTypeStr}${outStr}(${param}${labels})`;

            if (value === null) {
                res.clauses.push(`${isNot ? "" : "NOT "}EXISTS { ${matchPattern} }`);
                return res;
            }

            const recurse = createWhereAndParams({
                whereInput: value,
                varName: param,
                chainStr: param,
                node: refNode,
                context,
                recursing: true,
            });

            if (recurse[0]) {
                const clause = listPredicateToClause(listPredicate, matchPattern, recurse[0]);
                res.clauses.push(clause);
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
                const refNode = context.nodes.find(
                    (x) => x.name === entry[0] || x.interfaces.some((i) => i.name.value === entry[0])
                ) as Node;
                const relationship = context.relationships.find(
                    (x) => x.name === connectionField.relationshipTypeName
                ) as Relationship;

                const thisParam = `${param}_${refNode.name}`;
                const relationshipVariable = `${thisParam}_${connectionField.relationshipTypeName}`;
                const inStr = connectionField.relationship.direction === "IN" ? "<-" : "-";
                const outStr = connectionField.relationship.direction === "OUT" ? "->" : "-";
                const labels = refNode.getLabelString(context);

                const matchPattern = `(${varName})${inStr}[${relationshipVariable}:${connectionField.relationship.type}]${outStr}(${thisParam}${labels})`;

                if (value === null) {
                    // TODO: Change to EXISTS when filtering no longer in projection
                    res.clauses.push(`${isNot ? "" : "NOT "}exists(${matchPattern})`);
                    return;
                }

                const parameterPrefix = recursing
                    ? `${chainStr || varName}_${context.resolveTree.name}.where.${key}`
                    : `${varName}_${context.resolveTree.name}.where.${key}`;

                const connectionWhere = createConnectionWhereAndParams({
                    whereInput: entry[1] as any,
                    context,
                    node: refNode,
                    nodeVariable: thisParam,
                    relationship,
                    relationshipVariable,
                    parameterPrefix,
                    listPredicates: [listPredicate],
                });

                if (connectionWhere[0]) {
                    // TODO: Change to listPredicateToClause when filtering no longer in projection
                    const clause = listPredicateToSizeFunction(listPredicate, matchPattern, connectionWhere[0]);
                    res.clauses.push(clause);
                }

                const whereKeySuffix = operator ? `_${operator}` : "";
                const resolveTreeParams = recursing
                    ? {
                          [`${chainStr || varName}_${context.resolveTree.name}`]: {
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
