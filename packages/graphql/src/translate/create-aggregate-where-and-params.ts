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

import { GraphElement, Node, Relationship } from "../classes";
import { RelationField, Context, BaseField } from "../types";

type Operator = "=" | "<" | "<=" | ">" | ">=";

const logicalOperators = ["EQUAL", "GT", "GTE", "LT", "LTE"];

const aggregationOperators = ["SHORTEST", "LONGEST", "MIN", "MAX", "SUM"];

function createOperator(input: string): Operator {
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
    nodeOrRelationship: GraphElement;
    chainStr: string;
    variable: string;
}): { aggregations: string[]; params: any; withStrs: string[] } {
    const aggregations: string[] = [];
    let withStrs: string[] = [];
    let params = {};

    Object.entries(inputValue).forEach(([key, value]) => {
        if (["AND", "OR"].includes(key)) {
            const innerClauses: string[] = [];

            ((value as unknown) as any[]).forEach((v: any, i) => {
                const recurse = aggregate({
                    chainStr: `${chainStr}_${key}_${i}`,
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
                aggregations.push(`(${innerClauses.join(` ${key} `)})`);
            }

            return;
        }

        const field = [...nodeOrRelationship.primitiveFields, ...nodeOrRelationship.temporalFields].find((f) =>
            logicalOperators.some(
                (op) =>
                    key.split(`_${op}`)[0] === f.fieldName ||
                    key.split(`_AVERAGE_${op}`)[0] === f.fieldName ||
                    aggregationOperators.some((x) => key.split(`_${x}_${op}`)[0] === f.fieldName)
            )
        ) as BaseField;

        const dbPropertyName = field.dbPropertyName || field.fieldName;

        if (!field) {
            return;
        }

        const [, operatorString] = key.split(`${field.fieldName}_`);
        const paramName = `${chainStr}_${key}`;
        params[paramName] = value;

        if (logicalOperators.some((fO) => operatorString.split(`AVERAGE_`)[1] === fO)) {
            const [, averageOperatorString] = operatorString.split("AVERAGE_");
            const averageOperator = createOperator(averageOperatorString);

            if (field.typeMeta.name === "String") {
                const hoistedVariable = `${paramName}_SIZE`;

                withStrs.push(`size(${variable}.${dbPropertyName}) AS ${hoistedVariable}`);

                aggregations.push(`avg(${hoistedVariable}) ${averageOperator} toFloat($${paramName})`);

                return;
            }

            aggregations.push(`avg(${variable}.${dbPropertyName}) ${averageOperator} $${paramName}`);

            return;
        }

        if (logicalOperators.some((fO) => operatorString.split(`SUM_`)[1] === fO)) {
            const [, opStr] = operatorString.split("SUM_");
            const operator = createOperator(opStr);
            const hoistedVariable = `${paramName}_SUM`;

            withStrs.push(`sum(${variable}.${dbPropertyName}) AS ${hoistedVariable}`);
            aggregations.push(`${hoistedVariable} ${operator} toFloat($${paramName})`);

            return;
        }

        if (aggregationOperators.some((fO) => logicalOperators.includes(operatorString.split(`${fO}_`)[1]))) {
            if (field.typeMeta.name === "String") {
                const hoistedVariable = `${paramName}_SIZE`;
                const isShortest = operatorString.startsWith("SHORTEST_");
                const [, stringOperator] = operatorString.split(`${isShortest ? `SHORTEST` : "LONGEST"}_`);

                withStrs.push(`size(${variable}.${dbPropertyName}) AS ${hoistedVariable}`);

                aggregations.push(
                    `${isShortest ? `min` : "max"}(${hoistedVariable}) ${createOperator(stringOperator)} $${paramName}`
                );

                return;
            }

            const isMin = operatorString.startsWith("MIN_");
            const [, opString] = operatorString.split(`${isMin ? `MIN` : "MAX"}_`);

            aggregations.push(
                ` ${isMin ? `min` : "max"}(${variable}.${dbPropertyName}) ${createOperator(opString)} $${paramName}`
            );

            return;
        }

        const operator = createOperator(operatorString);

        if (field.typeMeta.name === "String") {
            if (operator !== "=") {
                aggregations.push(`size(${variable}.${dbPropertyName}) ${operator} $${paramName}`);

                return;
            }
        }

        // Default
        aggregations.push(`${variable}.${dbPropertyName} ${operator} $${paramName}`);
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

    Object.entries(aggregation).forEach(([key, value]) => {
        if (["AND", "OR"].includes(key)) {
            const innerClauses: string[] = [];

            ((value as unknown) as any[]).forEach((v: any, i) => {
                const recurse = createPredicate({
                    node,
                    chainStr: `${chainStr}_${key}_${i}`,
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
                aggregations.push(`(${innerClauses.join(` ${key} `)})`);
            }

            return;
        }

        ["count", "count_LT", "count_LTE", "count_GT", "count_GTE"].forEach((countType) => {
            if (key === countType) {
                const paramName = `${chainStr}_${key}`;
                params[paramName] = value;
                const operator = createOperator(countType.split("_")[1]);
                aggregations.push(`count(${nodeVariable}) ${operator} $${paramName}`);
            }
        });

        ["node", "edge"].forEach((nOrE) => {
            if (key !== nOrE) {
                return;
            }

            const agg = aggregate({
                chainStr: `${chainStr}_${key}`,
                inputValue: value,
                nodeOrRelationship: nOrE === "node" ? node : relationship,
                variable: nOrE === "node" ? nodeVariable : edgeVariable,
            });

            if (agg.aggregations.length) {
                aggregations.push(agg.aggregations.join(" AND "));
                params = { ...params, ...agg.params };
            }

            if (agg.withStrs.length) {
                withStrs = [...withStrs, ...agg.withStrs];
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
    const labels = node.getLabelString(context);
    const matchStr = `MATCH (${varName})${inStr}${relTypeStr}${outStr}(${nodeVariable}${labels})`;

    cyphers.push(`apoc.cypher.runFirstColumn(" ${matchStr}`);

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

    cyphers.push(`", { ${varName}: ${varName}${apocParams} }, false )`);

    return [cyphers.join("\n"), params];
}

export default createAggregateWhereAndParams;
