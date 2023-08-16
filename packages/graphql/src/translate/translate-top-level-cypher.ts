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

import createProjectionAndParams from "./create-projection-and-params";
import type { CypherField } from "../types";
import { AUTH_FORBIDDEN_ERROR, AUTHORIZATION_UNAUTHENTICATED } from "../constants";
import Cypher from "@neo4j/cypher-builder";
import { CompositeEntity } from "../schema-model/entity/CompositeEntity";
import { Neo4jGraphQLError } from "../classes";
import { filterByValues } from "./authorization/utils/filter-by-values";
import { compileCypher } from "../utils/compile-cypher";
import { applyAuthentication } from "./authorization/utils/apply-authentication";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";

export function translateTopLevelCypher({
    context,
    field,
    args,
    type,
    statement,
}: {
    context: Neo4jGraphQLTranslationContext;
    field: CypherField;
    args: any;
    statement: string;
    type: "Query" | "Mutation";
}): Cypher.CypherResult {
    const operation = context.schemaModel.operations[type];
    if (!operation) {
        throw new Error(`Failed to find operation ${type} in Schema Model.`);
    }
    const operationField = operation.findFields(field.fieldName);
    if (!operationField) {
        throw new Error(`Failed to find field ${field.fieldName} on operation ${type}.`);
    }
    const annotation = operationField.annotations.authentication;
    if (annotation) {
        applyAuthentication({ context, annotation });
    }
    const authorizationAnnotation = operationField.annotations.authorization;
    if (authorizationAnnotation) {
        const authorizationResults = authorizationAnnotation.validate?.map((rule) =>
            filterByValues(rule.where, { jwt: context.authorization.jwt })
        );
        if (authorizationResults?.every((result) => result === false)) {
            throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
        }
    }

    const { resolveTree } = context;
    let params = {
        ...args,
        cypherParams: context.cypherParams,
    };
    if (statement.includes("$jwt")) {
        params.jwt = context.authorization.jwtParam.value;
    }
    const cypherStrs: string[] = [];

    let projectionStr;
    const projectionAuthStrs: Cypher.Predicate[] = [];
    const projectionValidatePredicates: Cypher.Predicate[] = [];

    const projectionSubqueries: Cypher.Clause[] = [];

    const referenceNode = context.nodes.find((x) => x.name === field.typeMeta.name);

    if (referenceNode) {
        const {
            projection: str,
            params: p,
            subqueries,
            subqueriesBeforeSort,
            predicates,
        } = createProjectionAndParams({
            resolveTree,
            node: referenceNode,
            context,
            varName: new Cypher.NamedNode(`this`),
            cypherFieldAliasMap: {},
        });
        projectionStr = str;
        projectionSubqueries.push(...subqueriesBeforeSort, ...subqueries);
        params = { ...params, ...p };

        if (predicates.length) {
            projectionValidatePredicates.push(...predicates);
        }
    }

    const unionWhere: string[] = [];

    const entity = context.schemaModel.entities.get(field.typeMeta.name);

    if (entity instanceof CompositeEntity) {
        const headStrs: Cypher.Clause[] = [];
        const referencedNodes =
            entity.concreteEntities
                ?.map((u) => context.nodes.find((n) => n.name === u.name))
                ?.filter((b) => b !== undefined)
                ?.filter((n) => Object.keys(resolveTree.fieldsByTypeName).includes(n?.name ?? "")) || [];

        referencedNodes.forEach((node) => {
            if (node) {
                const labelsStatements = node.getLabels(context).map((label, index) => {
                    const param = `${node.name}_labels${index}`;
                    params[param] = label;
                    return `$${param} IN labels(this)`;
                });
                unionWhere.push(`(${labelsStatements.join("AND")})`);

                // TODO Migrate to CypherBuilder
                const innerNodePartialProjection = `[ this IN [this] WHERE (${labelsStatements.join(" AND ")})`;
                if (!resolveTree.fieldsByTypeName[node.name]) {
                    headStrs.push(
                        new Cypher.RawCypher(`${innerNodePartialProjection}| this { __resolveType: "${node.name}" }]`)
                    );
                } else {
                    const {
                        projection: str,
                        params: p,
                        subqueries,
                        predicates,
                    } = createProjectionAndParams({
                        resolveTree,
                        node,
                        context,
                        varName: new Cypher.NamedNode("this"),
                        cypherFieldAliasMap: {},
                    });
                    projectionSubqueries.push(...subqueries);
                    params = { ...params, ...p };
                    if (predicates.length) {
                        projectionValidatePredicates.push(...predicates);
                    }
                    headStrs.push(
                        new Cypher.RawCypher((env) => {
                            return innerNodePartialProjection
                                .concat(`| this { __resolveType: "${node.name}", `)
                                .concat(compileCypher(str, env).replace("{", ""))
                                .concat("]");
                        })
                    );
                }
            }
        });

        projectionStr = new Cypher.RawCypher(
            (env) => `${headStrs.map((headStr) => compileCypher(headStr, env)).join(" + ")}`
        );
    }

    // Null default argument values are not passed into the resolve tree therefore these are not being passed to
    // `apocParams` below causing a runtime error when executing.
    const nullArgumentValues = field.arguments.reduce(
        (res, argument) => ({
            ...res,
            ...{ [argument.name.value]: null },
        }),
        {}
    );

    const apocParams = Object.entries({ ...nullArgumentValues, ...resolveTree.args }).reduce(
        (result: { params: { [key: string]: unknown } }, entry) => ({
            params: { ...result.params, [entry[0]]: entry[1] },
        }),
        { params }
    );

    params = { ...params, ...apocParams.params, ...(context.cypherParams || {}) };

    if (type === "Query") {
        const cypherStatement = createCypherDirectiveSubquery({
            field,
        });
        cypherStrs.push(...cypherStatement);
    } else {
        const columnName = field.columnName;
        cypherStrs.push(`
            CALL {
                ${statement}
            }
            WITH ${columnName} AS this
        
        `);
    }

    if (unionWhere.length) {
        cypherStrs.push(`WHERE ${unionWhere.join(" OR ")}`);
    }

    const projectionSubquery = Cypher.concat(...projectionSubqueries);

    return new Cypher.RawCypher((env) => {
        const authPredicates: Cypher.Predicate[] = [];

        if (projectionValidatePredicates.length) {
            authPredicates.push(Cypher.and(...projectionValidatePredicates));
        }

        if (projectionAuthStrs.length) {
            const validatePred = Cypher.apoc.util.validatePredicate(
                Cypher.not(Cypher.and(...projectionAuthStrs)),
                AUTH_FORBIDDEN_ERROR
            );
            authPredicates.push(validatePred);
        }

        if (authPredicates.length) {
            cypherStrs.push(`WHERE ${compileCypher(Cypher.and(...authPredicates), env)}`);
        }

        const subqueriesStr = projectionSubquery ? `\n${compileCypher(projectionSubquery, env)}` : "";
        if (subqueriesStr) cypherStrs.push(subqueriesStr);

        if (field.isScalar || field.isEnum) {
            cypherStrs.push(`RETURN this`);
        } else if (entity instanceof CompositeEntity) {
            cypherStrs.push(`RETURN head( ${projectionStr.getCypher(env)} ) AS this`);
        } else {
            cypherStrs.push(`RETURN this ${projectionStr.getCypher(env)} AS this`);
        }
        return [cypherStrs.join("\n"), params];
    }).build();
}

function createCypherDirectiveSubquery({ field }: { field: CypherField }): string[] {
    const cypherStrs: string[] = [];
    cypherStrs.push("CALL {", field.statement, "}");

    if (field.columnName) {
        if (field.isScalar || field.isEnum) {
            cypherStrs.push(`UNWIND ${field.columnName} as this`);
        } else {
            cypherStrs.push(`WITH ${field.columnName} as this`);
        }
    }
    return cypherStrs;
}
