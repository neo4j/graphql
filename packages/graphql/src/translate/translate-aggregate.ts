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

import { Node } from "../classes";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { BaseField, Context, GraphQLWhereArg, PrimitiveField, TemporalField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createWhereAndParams from "./create-where-and-params";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";

function translateAggregate({ node, context }: { node: Node; context: Context }): [string, any] {
    const whereInput = context.resolveTree.args.where as GraphQLWhereArg;
    const { fieldsByTypeName } = context.resolveTree;
    const varName = "this";
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    const cypherStrs: string[] = [];

    const labels = node.getLabelString(context);

    cypherStrs.push(`MATCH (${varName}${labels})`);

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
            node,
            context,
            recursing: true,
        });
        if (where[0]) {
            whereStrs.push(where[0]);
            cypherParams = { ...cypherParams, ...where[1] };
        }
    }

    const whereAuth = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        where: { varName, node },
    });

    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        cypherStrs.push(`WHERE ${whereStrs.join(" AND ")}`);
    }

    const allowAuth = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (allowAuth[0]) {
        cypherStrs.push(`CALL apoc.util.validate(NOT(${allowAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        cypherParams = { ...cypherParams, ...allowAuth[1] };
    }

    const selections = fieldsByTypeName[`${node.name}AggregateSelection`];
    const projections: string[] = [];
    const authStrs: string[] = [];

    // Do auth first so we can throw out before aggregating
    Object.entries(selections).forEach((selection) => {
        const authField = node.authableFields.find((x) => x.fieldName === selection[0]);
        if (authField) {
            if (authField.auth) {
                const allowAndParams = createAuthAndParams({
                    entity: authField,
                    operations: "READ",
                    context,
                    allow: { parentNode: node, varName, chainStr: authField.fieldName },
                });
                if (allowAndParams[0]) {
                    authStrs.push(allowAndParams[0]);
                    cypherParams = { ...cypherParams, ...allowAndParams[1] };
                }
            }
        }
    });

    if (authStrs.length) {
        cypherStrs.push(`CALL apoc.util.validate(NOT(${authStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
    }

    Object.entries(selections).forEach((selection) => {
        if (selection[1].name === "count") {
            projections.push(`${selection[1].alias || selection[1].name}: count(${varName})`);
        }

        const primitiveField = node.primitiveFields.find((x) => x.fieldName === selection[1].name);
        const temporalField = node.temporalFields.find((x) => x.fieldName === selection[1].name);
        const field: BaseField = (primitiveField as PrimitiveField) || (temporalField as TemporalField);
        let isDateTime = false;
        const isString = primitiveField && primitiveField.typeMeta.name === "String";

        if (!primitiveField && temporalField && temporalField.typeMeta.name === "DateTime") {
            isDateTime = true;
        }

        if (field) {
            const thisProjections: string[] = [];
            const aggregateFields =
                selection[1].fieldsByTypeName[`${field.typeMeta.name}AggregateSelectionNullable`] ||
                selection[1].fieldsByTypeName[`${field.typeMeta.name}AggregateSelectionNonNullable`];

            Object.entries(aggregateFields).forEach((entry) => {
                // "min" | "max" | "average" | "sum" | "shortest" | "longest"
                let operator = entry[1].name;

                if (operator === "average") {
                    operator = "avg";
                }

                if (operator === "shortest") {
                    operator = "min";
                }

                if (operator === "longest") {
                    operator = "max";
                }

                const fieldName = field.dbPropertyName || field.fieldName;

                if (isDateTime) {
                    thisProjections.push(
                        createDatetimeElement({
                            resolveTree: entry[1],
                            field: field as TemporalField,
                            variable: varName,
                            valueOverride: `${operator}(this.${fieldName})`,
                        })
                    );

                    return;
                }

                if (isString) {
                    const lessOrGreaterThan = entry[1].name === "shortest" ? "<" : ">";

                    const reduce = `
                            reduce(shortest = collect(this.${fieldName})[0], current IN collect(this.${fieldName}) | apoc.cypher.runFirstColumn("
                                RETURN
                                CASE size(current) ${lessOrGreaterThan} size(shortest)
                                WHEN true THEN current
                                ELSE shortest
                                END AS result
                            ", { current: current, shortest: shortest }, false))
                        `;

                    thisProjections.push(`${entry[1].alias || entry[1].name}: ${reduce}`);

                    return;
                }

                thisProjections.push(`${entry[1].alias || entry[1].name}: ${operator}(this.${fieldName})`);
            });

            projections.push(`${selection[1].alias || selection[1].name}: { ${thisProjections.join(", ")} }`);
        }
    });

    cypherStrs.push(`RETURN { ${projections.join(", ")} }`);

    return [cypherStrs.filter(Boolean).join("\n"), cypherParams];
}

export default translateAggregate;
