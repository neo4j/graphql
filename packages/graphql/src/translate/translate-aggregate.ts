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

import Cypher from "@neo4j/cypher-builder";
import type { Node } from "../classes";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import type { BaseField, Context, GraphQLWhereArg, PrimitiveField, TemporalField } from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";
import { translateTopLevelMatch } from "./translate-top-level-match";

function translateAggregate({ node, context }: { node: Node; context: Context }): [Cypher.Clause, any] {
    const { fieldsByTypeName } = context.resolveTree;
    const varName = "this";
    let cypherParams: { [k: string]: any } = context.cypherParams ? { cypherParams: context.cypherParams } : {};
    const cypherStrs: Cypher.Clause[] = [];
    const matchNode = new Cypher.NamedNode(varName, { labels: node.getLabels(context) });
    const where = context.resolveTree.args.where as GraphQLWhereArg | undefined;
    const topLevelMatch = translateTopLevelMatch({ matchNode, node, context, operation: "READ", where });
    cypherStrs.push(new Cypher.RawCypher(topLevelMatch.cypher));
    cypherParams = { ...cypherParams, ...topLevelMatch.params };

    const allowAuth = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        allow: {
            node,
            varName,
        },
    });
    if (allowAuth[0]) {
        cypherStrs.push(
            new Cypher.CallProcedure(
                new Cypher.apoc.Validate(
                    Cypher.not(new Cypher.RawCypher(allowAuth[0])),
                    AUTH_FORBIDDEN_ERROR,
                    new Cypher.Literal([0])
                )
            )
        );
        cypherParams = { ...cypherParams, ...allowAuth[1] };
    }

    const selections = fieldsByTypeName[node.aggregateTypeNames.selection];
    const projections: Cypher.Map = new Cypher.Map();
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
                    allow: { node, varName },
                });
                if (allowAndParams[0]) {
                    authStrs.push(allowAndParams[0]);
                    cypherParams = { ...cypherParams, ...allowAndParams[1] };
                }
            }
        }
    });

    if (authStrs.length) {
        cypherStrs.push(
            new Cypher.CallProcedure(
                new Cypher.apoc.Validate(
                    Cypher.not(Cypher.and(...authStrs.map((str) => new Cypher.RawCypher(str)))),
                    AUTH_FORBIDDEN_ERROR,
                    new Cypher.Literal([0])
                )
            )
        );
    }

    Object.entries(selections).forEach((selection) => {
        if (selection[1].name === "count") {
            projections.set(`${selection[1].alias || selection[1].name}`, new Cypher.RawCypher(`count(${varName})`));
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
            const thisProjections: Cypher.Expr[] = [];
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
                            variable: new Cypher.NamedVariable(varName),
                            valueOverride: `${operator}(this.${fieldName})`,
                        })
                    );

                    return;
                }

                if (isString) {
                    const lessOrGreaterThan = entry[1].name === "shortest" ? "<" : ">";

                    const reduce = `
                            reduce(aggVar = collect(this.${fieldName})[0], current IN collect(this.${fieldName}) |
                                CASE
                                WHEN size(current) ${lessOrGreaterThan} size(aggVar) THEN current
                                ELSE aggVar
                                END
                            )
                        `;

                    thisProjections.push(new Cypher.RawCypher(`${entry[1].alias || entry[1].name}: ${reduce}`));

                    return;
                }

                thisProjections.push(
                    new Cypher.RawCypher(`${entry[1].alias || entry[1].name}: ${operator}(this.${fieldName})`)
                );
            });

            projections.set(
                `${selection[1].alias || selection[1].name}`,
                Cypher.count(new Cypher.NamedVariable(varName))
            );
            projections.set(
                `${selection[1].alias || selection[1].name}`,
                new Cypher.RawCypher((env) => `{ ${thisProjections.map((p) => p.getCypher(env)).join(", ")} }`)
            );
        }
    });

    const retSt = new Cypher.Return(projections);
    cypherStrs.push(retSt);

    return [Cypher.concat(...cypherStrs), cypherParams];
}

export default translateAggregate;
