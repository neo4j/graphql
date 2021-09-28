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

import { Node, Relationship } from "../classes";
import { RelationField, Context, BaseField } from "../types";

const fieldOperators = ["EQUAL", "GT", "GTE", "LT", "LTE"];

type Operator = "=" | "<" | "<=" | ">" | ">=";

function createOperator(input): Operator {
    let operator: Operator = "=";

    switch (input) {
        case "LT":
            operator = "<";
            break;
        case "LTE":
            operator = "<=";
            break;
        case "GT":
            operator = ">";
            break;
        case "GTE":
            operator = ">=";
            break;
        default:
            operator = "=";
            break;
    }

    return operator;
}

function aggregate({
    inputValue,
    nodeOrRelationship,
    chainStr,
    variable,
}: {
    inputValue: any;
    nodeOrRelationship: Node | Relationship;
    chainStr: string;
    variable: string;
}): { aggregations: string[]; params: any; withStrs: string[] } {
    const aggregations: string[] = [];
    let withStrs: string[] = [];
    let params = {};

    Object.entries(inputValue).forEach((e) => {
        if (["AND", "OR"].includes(e[0])) {
            const innerClauses: string[] = [];

            ((e[1] as unknown) as any[]).forEach((v: any, i) => {
                const recurse = aggregate({
                    chainStr: `${chainStr}_${e[0]}_${i}`,
                    inputValue: v,
                    nodeOrRelationship,
                    variable,
                });

                if (recurse.aggregations.length) {
                    innerClauses.push(recurse.aggregations.join(" AND "));
                    params = { ...params, ...recurse.params };
                }

                if (recurse.withStrs.length) {
                    withStrs = [...withStrs, ...recurse.withStrs];
                }
            });

            if (innerClauses.length) {
                aggregations.push(`(${innerClauses.join(` ${e[0]} `)})`);
            }

            return;
        }

        const field = [...nodeOrRelationship.primitiveFields, ...nodeOrRelationship.temporalFields].find((field) =>
            fieldOperators.some(
                (op) =>
                    e[0].split(`_${op}`)[0] === field.fieldName || e[0].split(`_AVERAGE_${op}`)[0] === field.fieldName
            )
        ) as BaseField;

        if (!field) {
            return;
        }

        const [, operatorString] = e[0].split(`${field.fieldName}_`);
        const paramName = `${chainStr}_${e[0]}`;
        params[paramName] = e[1];

        if (fieldOperators.some((fO) => operatorString.split(`AVERAGE_`)[1] === fO)) {
            const [, averageOperatorString] = operatorString.split("AVERAGE_");
            const averageOperator = createOperator(averageOperatorString);

            if (field.typeMeta.name === "String") {
                const hoistedVariable = `${paramName}_SIZE`;
                withStrs.push(`size(${variable}.${field.fieldName}) AS ${hoistedVariable}`);
                aggregations.push(`avg(${hoistedVariable}) ${averageOperator} toFloat($${paramName})`);

                return;
            }

            aggregations.push(`avg(${variable}.${field.fieldName}) ${averageOperator} $${paramName}`);

            return;
        }

        const operator = createOperator(operatorString);

        if (field.typeMeta.name === "String") {
            if (operator !== "=") {
                aggregations.push(`size(${variable}.${field.fieldName}) ${operator} $${paramName}`);

                return;
            }
        }

        // Default
        aggregations.push(`${variable}.${field.fieldName} ${operator} $${paramName}`);
    });

    return {
        aggregations,
        params,
        withStrs,
    };
}

function createPredicate({
    node,
    aggregation,
    context,
    chainStr,
    field,
    varName,
    nodeVariable,
    edgeVariable,
    relationship,
}: {
    aggregation: any;
    node: Node;
    context: Context;
    chainStr: string;
    field: RelationField;
    varName: string;
    nodeVariable: string;
    edgeVariable: string;
    relationship: Relationship;
}): { aggregations: string[]; params: any; withStrs: string[] } {
    const aggregations: string[] = [];
    let withStrs: string[] = [];
    let params = {};

    Object.entries(aggregation).forEach((entry) => {
        if (["AND", "OR"].includes(entry[0])) {
            const innerClauses: string[] = [];

            ((entry[1] as unknown) as any[]).forEach((v: any, i) => {
                const recurse = createPredicate({
                    node,
                    chainStr: `${chainStr}_${entry[0]}_${i}`,
                    context,
                    field,
                    varName,
                    aggregation: v,
                    nodeVariable,
                    edgeVariable,
                    relationship,
                });

                if (recurse.aggregations.length) {
                    innerClauses.push(recurse.aggregations.join(" AND "));
                    params = { ...params, ...recurse.params };
                }

                if (recurse.withStrs.length) {
                    withStrs = [...withStrs, ...recurse.withStrs];
                }
            });

            if (innerClauses.length) {
                aggregations.push(`(${innerClauses.join(` ${entry[0]} `)})`);
            }

            return;
        }

        ["count", "count_LT", "count_LTE", "count_GT", "count_GTE"].forEach((countType) => {
            if (entry[0] === countType) {
                const paramName = `${chainStr}_${entry[0]}`;
                params[paramName] = entry[1];
                const operator = createOperator(countType.split("_")[1]);
                aggregations.push(`count(${nodeVariable}) ${operator} $${paramName}`);
            }
        });

        ["node", "edge"].forEach((nOrE) => {
            if (entry[0] !== nOrE) {
                return;
            }

            const aggregation = aggregate({
                chainStr: `${chainStr}_${entry[0]}`,
                inputValue: entry[1],
                nodeOrRelationship: nOrE === "node" ? node : relationship,
                variable: nOrE === "node" ? nodeVariable : edgeVariable,
            });

            if (aggregation.aggregations.length) {
                aggregations.push(aggregation.aggregations.join(" AND "));
                params = { ...params, ...aggregation.params };
            }

            if (aggregation.withStrs.length) {
                withStrs = [...withStrs, ...aggregation.withStrs];
            }
        });
    });

    return {
        aggregations,
        params,
        withStrs,
    };
}

function createAggregateWhereAndParams({
    node,
    field,
    varName,
    chainStr,
    context,
    aggregation,
    relationship,
}: {
    node: Node;
    field: RelationField;
    varName: string;
    chainStr: string;
    context: Context;
    aggregation: any;
    relationship: Relationship;
}): [string, any] {
    const cyphers: string[] = [];
    const inStr = field.direction === "IN" ? "<-" : "-";
    const outStr = field.direction === "OUT" ? "->" : "-";
    const nodeVariable = `${chainStr}_node`;
    const edgeVariable = `${chainStr}_edge`;
    const relTypeStr = `[${edgeVariable}:${field.type}]`;
    const matchStr = `MATCH (${varName})${inStr}${relTypeStr}${outStr}(${nodeVariable}:${field.typeMeta.name})`;

    cyphers.push(`apoc.cypher.runFirstColumn(\" ${matchStr}`);

    const { aggregations, params, withStrs } = createPredicate({
        aggregation,
        chainStr,
        context,
        field,
        node,
        nodeVariable,
        edgeVariable,
        varName,
        relationship,
    });

    if (withStrs.length) {
        const uniqueWithList = [nodeVariable, edgeVariable, ...new Set(withStrs)];
        cyphers.push(`WITH ${uniqueWithList.join(", ")}`);
    }

    if (aggregations.length) {
        cyphers.push(`RETURN ${aggregations.join(" AND ")}`);
    }

    const apocParams = Object.keys(params).length
        ? `, ${Object.keys(params)
              .map((x) => `${x}: $${x}`)
              .join(", ")}`
        : "";

    cyphers.push(`", { this: ${varName}${apocParams} }, false )`);

    return [cyphers.join("\n"), params];
}

export default createAggregateWhereAndParams;
