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
import pluralize from "pluralize";
import type { Node, Relationship } from "../classes";
import { Neo4jGraphQLError } from "../classes";
import type { CallbackBucket } from "../classes/CallbackBucket";
import { META_CYPHER_VARIABLE, META_OLD_PROPS_CYPHER_VARIABLE } from "../constants";
import type { BaseField } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { caseWhere } from "../utils/case-where";
import { findConflictingProperties } from "../utils/find-conflicting-properties";
import mapToDbProperty from "../utils/map-to-db-property";
import { wrapStringInApostrophes } from "../utils/wrap-string-in-apostrophes";
import { checkAuthentication } from "./authorization/check-authentication";
import {
    createAuthorizationAfterAndParams,
    createAuthorizationAfterAndParamsField,
} from "./authorization/compatibility/create-authorization-after-and-params";
import {
    createAuthorizationBeforeAndParams,
    createAuthorizationBeforeAndParamsField,
} from "./authorization/compatibility/create-authorization-before-and-params";
import createConnectAndParams from "./create-connect-and-params";
import { createConnectOrCreateAndParams } from "./create-connect-or-create-and-params";
import createCreateAndParams from "./create-create-and-params";
import createDeleteAndParams from "./create-delete-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import { createRelationshipValidationString } from "./create-relationship-validation-string";
import createSetRelationshipProperties from "./create-set-relationship-properties";
import { createConnectionEventMeta } from "./subscriptions/create-connection-event-meta";
import { createEventMeta } from "./subscriptions/create-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import { addCallbackAndSetParam } from "./utils/callback-utils";
import { getAuthorizationStatements } from "./utils/get-authorization-statements";
import { indentBlock } from "./utils/indent-block";
import { buildMathStatements, matchMathField, mathDescriptorBuilder } from "./utils/math";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";

interface Res {
    strs: string[];
    params: any;
    meta: UpdateMeta;
}

interface UpdateMeta {
    preArrayMethodValidationStrs: [string, string][];
    authorizationBeforeSubqueries: string[];
    authorizationBeforePredicates: string[];
    authorizationAfterSubqueries: string[];
    authorizationAfterPredicates: string[];
}

export default function createUpdateAndParams({
    updateInput,
    varName,
    node,
    parentVar,
    chainStr,
    withVars,
    context,
    callbackBucket,
    parameterPrefix,
    includeRelationshipValidation,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    context: Neo4jGraphQLTranslationContext;
    callbackBucket: CallbackBucket;
    parameterPrefix: string;
    includeRelationshipValidation?: boolean;
}): [string, any] {
    let hasAppliedTimeStamps = false;

    const conflictingProperties = findConflictingProperties({ node, input: updateInput });
    if (conflictingProperties.length > 0) {
        throw new Neo4jGraphQLError(
            `Conflicting modification of ${conflictingProperties.map((n) => `[[${n}]]`).join(", ")} on type ${
                node.name
            }`
        );
    }

    checkAuthentication({ context, node, targetOperations: ["UPDATE"] });

    function reducer(res: Res, [key, value]: [string, any]) {
        let param: string;

        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${parentVar}_update_${key}`;
        }

        const relationField = node.relationFields.find((x) => key === x.fieldName);
        const pointField = node.pointFields.find((x) => key === x.fieldName);
        const dbFieldName = mapToDbProperty(node, key);

        if (relationField) {
            const refNodes: Node[] = [];

            const relationship = context.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown as Relationship;

            if (relationField.union) {
                Object.keys(value).forEach((unionTypeName) => {
                    refNodes.push(context.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            const subqueries: string[] = [];
            const intermediateWithMetaStatements: string[] = [];

            refNodes.forEach((refNode, idx) => {
                const v = relationField.union ? value[refNode.name] : value;
                const updates = relationField.typeMeta.array ? v : [v];
                const subquery: string[] = [];
                let returnMetaStatement = "";

                updates.forEach((update, index) => {
                    const relationshipVariable = `${varName}_${relationField.typeUnescaped.toLowerCase()}${index}_relationship`;
                    const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
                    const variableName = `${varName}_${key}${relationField.union ? `_${refNode.name}` : ""}${index}`;

                    if (update.delete) {
                        const innerVarName = `${variableName}_delete`;

                        const deleteAndParams = createDeleteAndParams({
                            context,
                            node,
                            deleteInput: { [key]: update.delete }, // OBJECT ENTIERS key reused twice
                            varName: innerVarName,
                            chainStr: innerVarName,
                            parentVar,
                            withVars,
                            parameterPrefix: `${parameterPrefix}.${key}${
                                relationField.typeMeta.array ? `[${index}]` : ``
                            }.delete`, // its use here
                            recursing: true,
                        });
                        subquery.push(deleteAndParams[0]);
                        res.params = { ...res.params, ...deleteAndParams[1] };
                    }

                    if (update.disconnect) {
                        const disconnectAndParams = createDisconnectAndParams({
                            context,
                            refNodes: [refNode],
                            value: update.disconnect,
                            varName: `${variableName}_disconnect`,
                            withVars,
                            parentVar,
                            relationField,
                            labelOverride: relationField.union ? refNode.name : "",
                            parentNode: node,
                            parameterPrefix: `${parameterPrefix}.${key}${
                                relationField.union ? `.${refNode.name}` : ""
                            }${relationField.typeMeta.array ? `[${index}]` : ""}.disconnect`,
                        });
                        subquery.push(disconnectAndParams[0]);
                        res.params = { ...res.params, ...disconnectAndParams[1] };
                    }

                    if (update.update) {
                        const whereStrs: string[] = [];
                        const delayedSubquery: string[] = [];
                        let aggregationWhere = false;

                        if (update.where) {
                            try {
                                const {
                                    cypher: whereClause,
                                    subquery: preComputedSubqueries,
                                    params: whereParams,
                                } = createConnectionWhereAndParams({
                                    whereInput: update.where,
                                    node: refNode,
                                    nodeVariable: variableName,
                                    relationship,
                                    relationshipVariable,
                                    context,
                                    parameterPrefix: `${parameterPrefix}.${key}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }${relationField.typeMeta.array ? `[${index}]` : ``}.where`,
                                });

                                if (whereClause) {
                                    whereStrs.push(whereClause);
                                    res.params = { ...res.params, ...whereParams };
                                    if (preComputedSubqueries) {
                                        delayedSubquery.push(preComputedSubqueries);
                                        aggregationWhere = true;
                                    }
                                }
                            } catch {
                                return;
                            }
                        }

                        const innerUpdate: string[] = [];
                        if (withVars) {
                            innerUpdate.push(`WITH ${withVars.join(", ")}`);
                        }

                        const labels = refNode.getLabelString(context);
                        innerUpdate.push(
                            `MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${variableName}${labels})`
                        );
                        innerUpdate.push(...delayedSubquery);

                        const authorizationBeforeAndParams = createAuthorizationBeforeAndParams({
                            context,
                            nodes: [{ node: refNode, variable: variableName }],
                            operations: ["UPDATE"],
                        });

                        if (authorizationBeforeAndParams) {
                            const { cypher, params: authWhereParams, subqueries } = authorizationBeforeAndParams;

                            whereStrs.push(cypher);
                            res.params = { ...res.params, ...authWhereParams };

                            if (subqueries) {
                                innerUpdate.push(subqueries);
                            }
                        }

                        if (whereStrs.length) {
                            const predicate = `${whereStrs.join(" AND ")}`;
                            if (aggregationWhere) {
                                const columns = [
                                    new Cypher.NamedVariable(relationshipVariable),
                                    new Cypher.NamedVariable(variableName),
                                ];
                                const caseWhereClause = caseWhere(new Cypher.Raw(predicate), columns);
                                const { cypher } = caseWhereClause.build("aggregateWhereFilter");
                                innerUpdate.push(cypher);
                            } else {
                                innerUpdate.push(`WHERE ${predicate}`);
                            }
                        }

                        if (update.update.edge) {
                            const entity = context.schemaModel.getConcreteEntityAdapter(node.name);
                            const relationshipAdapter = entity
                                ? entity.findRelationship(relationField.fieldName)
                                : undefined;
                            const setProperties = createSetRelationshipProperties({
                                properties: update.update.edge,
                                varName: relationshipVariable,
                                withVars: withVars,
                                relationship,
                                relationshipAdapter,
                                callbackBucket,
                                operation: "UPDATE",
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ``}.update.edge`,
                            });
                            if (setProperties) {
                                innerUpdate.push(setProperties);
                            }
                        }

                        if (update.update.node) {
                            const nestedWithVars = [...withVars, variableName];

                            const nestedUpdateInput = Object.entries(update.update.node).reduce(
                                (d1, [k1, v1]) => ({ ...d1, [k1]: v1 }),
                                {}
                            );

                            const updateAndParams = createUpdateAndParams({
                                context,
                                callbackBucket,
                                node: refNode,
                                updateInput: nestedUpdateInput,
                                varName: variableName,
                                withVars: nestedWithVars,
                                parentVar: variableName,
                                chainStr: `${param}${relationField.union ? `_${refNode.name}` : ""}${index}`,
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ``}.update.node`,
                                includeRelationshipValidation: true,
                            });
                            res.params = { ...res.params, ...updateAndParams[1] };
                            innerUpdate.push(updateAndParams[0]);
                        }

                        if (context.subscriptionsEnabled) {
                            innerUpdate.push(`RETURN collect(${META_CYPHER_VARIABLE}) as update_meta`);
                            returnMetaStatement = `meta AS update${idx}_meta`;
                            intermediateWithMetaStatements.push(`WITH *, update${idx}_meta AS meta`);
                        } else {
                            innerUpdate.push(`RETURN count(*) AS update_${variableName}`);
                        }

                        subquery.push(
                            `WITH ${withVars.join(", ")}`,
                            "CALL {",
                            indentBlock(innerUpdate.join("\n")),
                            "}"
                        );
                        if (context.subscriptionsEnabled) {
                            const reduceMeta = `REDUCE(m=${META_CYPHER_VARIABLE}, n IN update_meta | m + n) AS ${META_CYPHER_VARIABLE}`;
                            subquery.push(`WITH ${filterMetaVariable(withVars).join(", ")}, ${reduceMeta}`);
                        }
                    }

                    if (update.connect) {
                        const connectAndParams = createConnectAndParams({
                            context,
                            callbackBucket,
                            refNodes: [refNode],
                            value: update.connect,
                            varName: `${variableName}_connect`,
                            withVars,
                            parentVar,
                            relationField,
                            labelOverride: relationField.union ? refNode.name : "",
                            parentNode: node,
                            source: "UPDATE",
                        });
                        subquery.push(connectAndParams[0]);
                        if (context.subscriptionsEnabled) {
                            returnMetaStatement = `meta AS update${idx}_meta`;
                            intermediateWithMetaStatements.push(`WITH *, update${idx}_meta AS meta`);
                        }
                        res.params = { ...res.params, ...connectAndParams[1] };
                    }

                    if (update.connectOrCreate) {
                        const { cypher, params } = createConnectOrCreateAndParams({
                            input: update.connectOrCreate,
                            varName: `${variableName}_connectOrCreate`,
                            parentVar: varName,
                            relationField,
                            refNode,
                            node,
                            context,
                            withVars,
                            callbackBucket,
                        });
                        subquery.push(cypher);
                        res.params = { ...res.params, ...params };
                    }

                    if (update.create) {
                        if (withVars) {
                            subquery.push(`WITH ${withVars.join(", ")}`);
                        }
                        const creates = relationField.typeMeta.array ? update.create : [update.create];
                        creates.forEach((create, i) => {
                            const baseName = `${variableName}_create${i}`;
                            const nodeName = `${baseName}_node`;
                            const propertiesName = `${baseName}_relationship`;

                            let createNodeInput = {
                                input: create.node,
                            };

                            if (relationField.interface) {
                                const nodeFields = create.node[refNode.name];
                                if (!nodeFields) return; // Interface specific type not defined
                                createNodeInput = {
                                    input: nodeFields,
                                };
                            }

                            const {
                                create: nestedCreate,
                                params,
                                authorizationPredicates,
                                authorizationSubqueries,
                            } = createCreateAndParams({
                                context,
                                node: refNode,
                                callbackBucket,
                                varName: nodeName,
                                withVars: [...withVars, nodeName],
                                includeRelationshipValidation: false,
                                ...createNodeInput,
                            });
                            subquery.push(nestedCreate);
                            res.params = { ...res.params, ...params };
                            const relationVarName = create.edge || context.subscriptionsEnabled ? propertiesName : "";
                            subquery.push(
                                `MERGE (${parentVar})${inStr}[${relationVarName}:${relationField.type}]${outStr}(${nodeName})`
                            );

                            if (create.edge) {
                                const entity = context.schemaModel.getConcreteEntityAdapter(node.name);
                                const relationshipAdapter = entity
                                    ? entity.findRelationship(relationField.fieldName)
                                    : undefined;
                                const setA = createSetRelationshipProperties({
                                    properties: create.edge,
                                    varName: propertiesName,
                                    withVars,
                                    relationship,
                                    relationshipAdapter,
                                    callbackBucket,
                                    operation: "CREATE",
                                    parameterPrefix: `${parameterPrefix}.${key}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }[${index}].create[${i}].edge`,
                                });
                                if (setA) {
                                    subquery.push(setA);
                                }
                            }

                            subquery.push(
                                ...getAuthorizationStatements(authorizationPredicates, authorizationSubqueries)
                            );

                            if (context.subscriptionsEnabled) {
                                const [fromVariable, toVariable] =
                                    relationField.direction === "IN" ? [nodeName, varName] : [varName, nodeName];
                                const [fromTypename, toTypename] =
                                    relationField.direction === "IN"
                                        ? [refNode.name, node.name]
                                        : [node.name, refNode.name];
                                const eventWithMetaStr = createConnectionEventMeta({
                                    event: "create_relationship",
                                    relVariable: propertiesName,
                                    fromVariable,
                                    toVariable,
                                    typename: relationField.typeUnescaped,
                                    fromTypename,
                                    toTypename,
                                });
                                subquery.push(
                                    `WITH ${eventWithMetaStr}, ${filterMetaVariable([...withVars, nodeName]).join(
                                        ", "
                                    )}`
                                );
                                returnMetaStatement = `meta AS update${idx}_meta`;
                                intermediateWithMetaStatements.push(`WITH *, update${idx}_meta AS meta`);
                            }

                            const relationshipValidationStr = createRelationshipValidationString({
                                node: refNode,
                                context,
                                varName: nodeName,
                            });
                            if (relationshipValidationStr) {
                                subquery.push(`WITH ${[...withVars, nodeName].join(", ")}`);
                                subquery.push(relationshipValidationStr);
                            }
                        });
                    }

                    if (relationField.interface) {
                        const returnStatement = `RETURN count(*) AS update_${varName}_${refNode.name}`;
                        if (context.subscriptionsEnabled && returnMetaStatement) {
                            subquery.push(`RETURN ${returnMetaStatement}`);
                        } else {
                            subquery.push(returnStatement);
                        }
                    }
                });

                if (subquery.length) {
                    subqueries.push(subquery.join("\n"));
                }
            });
            if (relationField.interface) {
                res.strs.push(`WITH ${withVars.join(", ")}`);
                res.strs.push(`CALL {\n\t WITH ${withVars.join(", ")}\n\t`);
                const subqueriesWithMetaPassedOn = subqueries.map(
                    (each, i) => each + `\n}\n${intermediateWithMetaStatements[i] || ""}`
                );
                res.strs.push(subqueriesWithMetaPassedOn.join(`\nCALL {\n\t WITH ${withVars.join(", ")}\n\t`));
            } else {
                res.strs.push(subqueries.join("\n"));
            }

            return res;
        }

        if (!hasAppliedTimeStamps) {
            const timestampedFields = node.temporalFields.filter(
                (temporalField) =>
                    ["DateTime", "Time"].includes(temporalField.typeMeta.name) &&
                    temporalField.timestamps?.includes("UPDATE")
            );
            timestampedFields.forEach((field) => {
                // DateTime -> datetime(); Time -> time()
                res.strs.push(`SET ${varName}.${field.dbPropertyName} = ${field.typeMeta.name.toLowerCase()}()`);
            });

            hasAppliedTimeStamps = true;
        }

        [...node.primitiveFields, ...node.temporalFields].forEach((field) =>
            addCallbackAndSetParam(field, varName, updateInput, callbackBucket, res.strs, "UPDATE")
        );

        const mathMatch = matchMathField(key);
        const { hasMatched, propertyName } = mathMatch;
        const settableFieldComparator = hasMatched ? propertyName : key;
        const settableField = node.mutableFields.find((x) => x.fieldName === settableFieldComparator);
        const authableField = node.authableFields.find(
            (x) => x.fieldName === key || `${x.fieldName}_PUSH` === key || `${x.fieldName}_POP` === key
        );

        if (settableField) {
            if (settableField.typeMeta.required && value === null) {
                throw new Error(`Cannot set non-nullable field ${node.name}.${settableField.fieldName} to null`);
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    res.strs.push(`SET ${varName}.${dbFieldName} = [p in $${param} | point(p)]`);
                } else {
                    res.strs.push(`SET ${varName}.${dbFieldName} = point($${param})`);
                }
            } else if (hasMatched) {
                const mathDescriptor = mathDescriptorBuilder(value as number, node, mathMatch);
                if (updateInput[mathDescriptor.dbName]) {
                    throw new Error(
                        `Cannot mutate the same field multiple times in one Mutation: ${mathDescriptor.dbName}`
                    );
                }

                const mathStatements = buildMathStatements(mathDescriptor, varName, withVars, param);
                res.strs.push(...mathStatements);
            } else {
                res.strs.push(`SET ${varName}.${dbFieldName} = $${param}`);
            }
            res.params[param] = value;
        }

        if (authableField) {
            const authorizationBeforeAndParams = createAuthorizationBeforeAndParamsField({
                context,
                nodes: [{ node: node, variable: varName, fieldName: authableField.fieldName }],
                operations: ["UPDATE"],
            });

            if (authorizationBeforeAndParams) {
                const { cypher, params: authWhereParams, subqueries } = authorizationBeforeAndParams;

                res.meta.authorizationBeforePredicates.push(cypher);

                if (subqueries) {
                    res.meta.authorizationBeforeSubqueries.push(subqueries);
                }

                res.params = { ...res.params, ...authWhereParams };
            }

            const authorizationAfterAndParams = createAuthorizationAfterAndParamsField({
                context,
                nodes: [{ node: node, variable: varName, fieldName: authableField.fieldName }],
                operations: ["UPDATE"],
            });

            if (authorizationAfterAndParams) {
                const { cypher, params: authWhereParams, subqueries } = authorizationAfterAndParams;

                res.meta.authorizationAfterPredicates.push(cypher);

                if (subqueries) {
                    res.meta.authorizationAfterSubqueries.push(subqueries);
                }

                res.params = { ...res.params, ...authWhereParams };
            }
        }

        const pushSuffix = "_PUSH";
        const pushField = node.mutableFields.find((x) => `${x.fieldName}${pushSuffix}` === key);
        if (pushField) {
            if (pushField.dbPropertyName && updateInput[pushField.dbPropertyName]) {
                throw new Error(
                    `Cannot mutate the same field multiple times in one Mutation: ${pushField.dbPropertyName}`
                );
            }

            validateNonNullProperty(res, varName, pushField);
            checkAuthentication({ context, node, targetOperations: ["UPDATE"], field: pushField.fieldName });

            const pointArrayField = node.pointFields.find((x) => `${x.fieldName}_PUSH` === key);
            if (pointArrayField) {
                res.strs.push(
                    `SET ${varName}.${pushField.dbPropertyName} = ${varName}.${pushField.dbPropertyName} + [p in $${param} | point(p)]`
                );
            } else {
                res.strs.push(
                    `SET ${varName}.${pushField.dbPropertyName} = ${varName}.${pushField.dbPropertyName} + $${param}`
                );
            }

            res.params[param] = value;
        }

        const popSuffix = `_POP`;
        const popField = node.mutableFields.find((x) => `${x.fieldName}${popSuffix}` === key);
        if (popField) {
            if (popField.dbPropertyName && updateInput[popField.dbPropertyName]) {
                throw new Error(
                    `Cannot mutate the same field multiple times in one Mutation: ${popField.dbPropertyName}`
                );
            }

            validateNonNullProperty(res, varName, popField);
            checkAuthentication({ context, node, targetOperations: ["UPDATE"], field: popField.fieldName });

            res.strs.push(
                `SET ${varName}.${popField.dbPropertyName} = ${varName}.${popField.dbPropertyName}[0..-$${param}]`
            );

            res.params[param] = value;
        }

        if (!pushField && !popField) {
            checkAuthentication({ context, node, targetOperations: ["UPDATE"], field: key });
        }

        return res;
    }

    const reducedUpdate = Object.entries(updateInput as Record<string, unknown>).reduce(reducer, {
        strs: [],
        meta: {
            preArrayMethodValidationStrs: [],
            authorizationBeforeSubqueries: [],
            authorizationBeforePredicates: [],
            authorizationAfterSubqueries: [],
            authorizationAfterPredicates: [],
        },
        params: {},
    });
    const { strs, meta } = reducedUpdate;
    let params = reducedUpdate.params;

    const authorizationBeforeStrs = meta.authorizationBeforePredicates;
    const authorizationBeforeSubqueries = meta.authorizationBeforeSubqueries;
    const authorizationAfterStrs = meta.authorizationAfterPredicates;
    const authorizationAfterSubqueries = meta.authorizationAfterSubqueries;

    const withStr = `WITH ${withVars.join(", ")}`;

    const authorizationAfterAndParams = createAuthorizationAfterAndParams({
        context,
        nodes: [{ node, variable: varName }],
        operations: ["UPDATE"],
    });

    if (authorizationAfterAndParams) {
        const { cypher, params: authWhereParams, subqueries } = authorizationAfterAndParams;

        if (cypher) {
            if (subqueries) {
                authorizationAfterSubqueries.push(subqueries);
            }

            authorizationAfterStrs.push(cypher);
            params = { ...params, ...authWhereParams };
        }
    }

    const preUpdatePredicates = authorizationBeforeStrs;

    const preArrayMethodValidationStr = "";
    const relationshipValidationStr = includeRelationshipValidation
        ? createRelationshipValidationString({ node, context, varName })
        : "";

    if (meta.preArrayMethodValidationStrs.length) {
        const nullChecks = meta.preArrayMethodValidationStrs.map((validationStr) => `${validationStr[0]} IS NULL`);
        const propertyNames = meta.preArrayMethodValidationStrs.map((validationStr) => validationStr[1]);

        preUpdatePredicates.push(
            `apoc.util.validatePredicate(${nullChecks.join(" OR ")}, "${pluralize(
                "Property",
                propertyNames.length
            )} ${propertyNames.map(() => "%s").join(", ")} cannot be NULL", [${wrapStringInApostrophes(
                propertyNames
            ).join(", ")}])`
        );
    }

    let preUpdatePredicatesStr = "";
    let authorizationAfterStr = "";

    if (preUpdatePredicates.length) {
        if (authorizationBeforeSubqueries.length) {
            preUpdatePredicatesStr = `${withStr}\n${authorizationBeforeSubqueries.join(
                "\n"
            )}\nWITH *\nWHERE ${preUpdatePredicates.join(" AND ")}`;
        } else {
            preUpdatePredicatesStr = `${withStr}\nWHERE ${preUpdatePredicates.join(" AND ")}`;
        }
    }

    if (authorizationAfterStrs.length) {
        if (authorizationAfterSubqueries.length) {
            authorizationAfterStr = `${withStr}\n${authorizationAfterSubqueries.join(
                "\n"
            )}\nWITH *\nWHERE ${authorizationAfterStrs.join(" AND ")}`;
        } else {
            authorizationAfterStr = `${withStr}\nWHERE ${authorizationAfterStrs.join(" AND ")}`;
        }
    }

    let statements = strs;
    if (context.subscriptionsEnabled) {
        statements = wrapInSubscriptionsMetaCall({
            withVars,
            nodeVariable: varName,
            typename: node.name,
            statements: strs,
        });
    }
    return [
        [
            preUpdatePredicatesStr,
            preArrayMethodValidationStr,
            ...statements,
            authorizationAfterStr,
            ...(relationshipValidationStr ? [withStr, relationshipValidationStr] : []),
        ].join("\n"),
        params,
    ];
}

function validateNonNullProperty(res: Res, varName: string, field: BaseField) {
    res.meta.preArrayMethodValidationStrs.push([`${varName}.${field.dbPropertyName}`, `${field.dbPropertyName}`]);
}

function wrapInSubscriptionsMetaCall({
    statements,
    nodeVariable,
    typename,
    withVars,
}: {
    statements: string[];
    nodeVariable: string;
    typename: string;
    withVars: string[];
}): string[] {
    const updateMetaVariable = "update_meta";
    const preCallWith = `WITH ${nodeVariable} { .* } AS ${META_OLD_PROPS_CYPHER_VARIABLE}, ${withVars.join(", ")}`;

    const callBlock = ["WITH *", ...statements, `RETURN ${META_CYPHER_VARIABLE} as ${updateMetaVariable}`];
    const postCallWith = `WITH *, ${updateMetaVariable} as ${META_CYPHER_VARIABLE}`;

    const eventMeta = createEventMeta({ event: "update", nodeVariable, typename });
    const eventMetaWith = `WITH ${filterMetaVariable(withVars).join(", ")}, ${eventMeta}`;

    return [preCallWith, "CALL {", ...indentBlock(callBlock), "}", postCallWith, eventMetaWith];
}
