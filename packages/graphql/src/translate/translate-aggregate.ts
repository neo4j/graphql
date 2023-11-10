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
import Debug from "debug";
import type { Node } from "../classes";
import { DEBUG_TRANSLATE } from "../constants";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import type { BaseField, GraphQLWhereArg, PrimitiveField, TemporalField } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { compileCypher } from "../utils/compile-cypher";
import { createAuthorizationBeforePredicate } from "./authorization/create-authorization-before-predicate";
import { createDatetimeElement } from "./projection/elements/create-datetime-element";
import { QueryASTFactory } from "./queryAST/factory/QueryASTFactory";
import { translateTopLevelMatch } from "./translate-top-level-match";

const debug = Debug(DEBUG_TRANSLATE);

function translateQuery({
    context,
    entityAdapter,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
}): Cypher.CypherResult {
    const { resolveTree } = context;
    // TODO: Rename QueryAST to OperationsTree
    const queryASTFactory = new QueryASTFactory(context.schemaModel);

    if (!entityAdapter) throw new Error("Entity not found");
    const queryAST = queryASTFactory.createQueryAST(resolveTree, entityAdapter, context);
    debug(queryAST.print());
    const clause = queryAST.build(context);
    return clause.build();
}

function translateAggregate({
    node,
    context,
    entityAdapter,
}: {
    node: Node | undefined;
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
}): Cypher.CypherResult {
    // TODO: Move fulltext to new translation layer to remove the deprecated translation
    if (!context.resolveTree.args.fulltext && !context.resolveTree.args.phrase) {
        return translateQuery({ context, entityAdapter });
    }

    if (!node) {
        throw new Error("Translating Read: Node cannot be on aggregation.");
    }

    const { fieldsByTypeName } = context.resolveTree;
    const varName = "this";
    let cypherParams: Record<string, any> = {};
    const cypherStrs: Cypher.Clause[] = [];
    const matchNode = new Cypher.NamedNode(varName, { labels: node.getLabels(context) });
    const where = context.resolveTree.args.where as GraphQLWhereArg | undefined;
    const topLevelMatch = translateTopLevelMatch({ matchNode, node, context, operation: "AGGREGATE", where });
    cypherStrs.push(new Cypher.RawCypher(topLevelMatch.cypher));
    cypherParams = { ...cypherParams, ...topLevelMatch.params };

    const selections = fieldsByTypeName[node.aggregateTypeNames.selection] || {};
    const projections: Cypher.Map = new Cypher.Map();

    // Do auth first so we can throw out before aggregating
    Object.entries(selections).forEach((selection) => {
        const authField = node.authableFields.find((x) => x.fieldName === selection[0]);
        if (authField) {
            const authorizationPredicateReturn = createAuthorizationBeforePredicate({
                context,
                nodes: [
                    {
                        variable: new Cypher.NamedNode(varName),
                        node,
                        fieldName: authField.fieldName,
                    },
                ],
                // This operation needs to be READ because this will actually return values, unlike the top-level AGGREGATE
                operations: ["READ"],
            });
            if (authorizationPredicateReturn) {
                const { predicate, preComputedSubqueries } = authorizationPredicateReturn;
                if (predicate) {
                    if (preComputedSubqueries && !preComputedSubqueries.empty) {
                        cypherStrs.push(preComputedSubqueries);
                    }
                    cypherStrs.push(new Cypher.With("*").where(predicate));
                }
            }
        }
    });

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
                selection[1].fieldsByTypeName[`${field.typeMeta.name}AggregateSelectionNonNullable`] ||
                {};

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
                new Cypher.RawCypher((env) => `{ ${thisProjections.map((p) => compileCypher(p, env)).join(", ")} }`)
            );
        }
    });

    const retSt = new Cypher.Return(projections);
    cypherStrs.push(retSt);

    return Cypher.concat(...cypherStrs).build(undefined, cypherParams);
}

export default translateAggregate;
