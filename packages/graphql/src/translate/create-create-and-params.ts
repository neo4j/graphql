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

import type { Node, Relationship } from "../classes";
import { Neo4jGraphQLError } from "../classes/Error";
import type { CallbackBucket } from "../classes/CallbackBucket";
import createConnectAndParams from "./create-connect-and-params";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";
import mapToDbProperty from "../utils/map-to-db-property";
import { createConnectOrCreateAndParams } from "./create-connect-or-create-and-params";
import createRelationshipValidationStr from "./create-relationship-validation-string";
import { createEventMeta } from "./subscriptions/create-event-meta";
import { createConnectionEventMeta } from "./subscriptions/create-connection-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import { addCallbackAndSetParam } from "./utils/callback-utils";
import { findConflictingProperties } from "../utils/is-property-clash";
import { createAuthorizationAfterAndParams } from "./authorization/compatibility/create-authorization-after-and-params";
import { checkAuthentication } from "./authorization/check-authentication";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";

interface Res {
    creates: string[];
    params: any;
    meta: CreateMeta;
}

interface CreateMeta {
    authStrs: string[];
    authorizationPredicates: string[];
    authorizationSubqueries: string[];
}

function createCreateAndParams({
    input,
    varName,
    node,
    context,
    callbackBucket,
    withVars,
    includeRelationshipValidation,
    topLevelNodeVariable,
}: {
    input: any;
    varName: string;
    node: Node;
    context: Neo4jGraphQLTranslationContext;
    callbackBucket: CallbackBucket;
    withVars: string[];
    includeRelationshipValidation?: boolean;
    topLevelNodeVariable?: string;
}): [string, any] {
    const conflictingProperties = findConflictingProperties({ node, input });
    if (conflictingProperties.length > 0) {
        throw new Neo4jGraphQLError(
            `Conflicting modification of ${conflictingProperties.map((n) => `[[${n}]]`).join(", ")} on type ${
                node.name
            }`
        );
    }
    checkAuthentication({ context, node, targetOperations: ["CREATE"] });

    function reducer(res: Res, [key, value]: [string, any]): Res {
        const varNameKey = `${varName}_${key}`;
        const relationField = node.relationFields.find((x) => key === x.fieldName);
        const primitiveField = node.primitiveFields.find((x) => key === x.fieldName);
        const pointField = node.pointFields.find((x) => key === x.fieldName);
        const dbFieldName = mapToDbProperty(node, key);

        if (primitiveField) {
            checkAuthentication({ context, node, targetOperations: ["CREATE"], field: primitiveField.fieldName });
        }

        if (relationField) {
            const refNodes: Node[] = [];

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

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const unionTypeName = relationField.union || relationField.interface ? refNode.name : "";

                if (v.create) {
                    const isInterfaceAnArray = relationField.interface?.typeMeta.array;
                    const createNodeInputIsOfTypeRefNode = !!v.create.node?.[refNode.name];
                    const createNodeInputKeys = createNodeInputIsOfTypeRefNode
                        ? Object.keys((v.create.node as any[]) || [])
                        : [];
                    const isCreatingMultipleNodesForOneToOneRel = !isInterfaceAnArray && createNodeInputKeys.length > 1;
                    if (isCreatingMultipleNodesForOneToOneRel) {
                        throw new Error(
                            `Relationship field "${relationField.connectionPrefix}.${
                                relationField.interface?.dbPropertyName || relationField.interface?.fieldName
                            }" cannot have more than one node linked`
                        );
                    }

                    const creates = relationField.typeMeta.array ? v.create : [v.create];
                    creates.forEach((create, index) => {
                        if (relationField.interface && !create.node[refNode.name]) {
                            return;
                        }

                        if (!context.subscriptionsEnabled) {
                            res.creates.push(`\nWITH ${withVars.join(", ")}`);
                        }

                        const baseName = `${varNameKey}${relationField.union ? "_" : ""}${unionTypeName}${index}`;
                        const nodeName = `${baseName}_node`;
                        const propertiesName = `${baseName}_relationship`;

                        const recurse = createCreateAndParams({
                            input: relationField.interface ? create.node[refNode.name] : create.node,
                            context,
                            callbackBucket,
                            node: refNode,
                            varName: nodeName,
                            withVars: [...withVars, nodeName],
                            includeRelationshipValidation: false,
                            topLevelNodeVariable,
                        });
                        res.creates.push(recurse[0]);
                        res.params = { ...res.params, ...recurse[1] };

                        const inStr = relationField.direction === "IN" ? "<-" : "-";
                        const outStr = relationField.direction === "OUT" ? "->" : "-";
                        const relationVarName =
                            relationField.properties || context.subscriptionsEnabled ? propertiesName : "";
                        const relTypeStr = `[${relationVarName}:${relationField.type}]`;
                        res.creates.push(`MERGE (${varName})${inStr}${relTypeStr}${outStr}(${nodeName})`);

                        if (relationField.properties) {
                            const relationship = context.relationships.find(
                                (x) => x.properties === relationField.properties
                            ) as unknown as Relationship;

                            const setA = createSetRelationshipPropertiesAndParams({
                                properties: create.edge ?? {},
                                varName: propertiesName,
                                relationship,
                                operation: "CREATE",
                                callbackBucket,
                            });
                            res.creates.push(setA[0]);
                            res.params = { ...res.params, ...setA[1] };
                        }

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
                            res.creates.push(
                                `WITH ${eventWithMetaStr}, ${filterMetaVariable([...withVars, nodeName]).join(", ")}`
                            );
                        }

                        const relationshipValidationStr = createRelationshipValidationStr({
                            node: refNode,
                            context,
                            varName: nodeName,
                        });
                        if (relationshipValidationStr) {
                            res.creates.push(`WITH ${[...withVars, nodeName].join(", ")}`);
                            res.creates.push(relationshipValidationStr);
                        }
                    });
                }

                if (!relationField.interface && v.connect) {
                    const connectAndParams = createConnectAndParams({
                        withVars,
                        value: v.connect,
                        varName: `${varNameKey}${relationField.union ? "_" : ""}${unionTypeName}_connect`,
                        parentVar: varName,
                        relationField,
                        context,
                        callbackBucket,
                        refNodes: [refNode],
                        labelOverride: unionTypeName,
                        parentNode: node,
                    });
                    res.creates.push(connectAndParams[0]);
                    res.params = { ...res.params, ...connectAndParams[1] };
                }

                if (v.connectOrCreate) {
                    const { cypher, params } = createConnectOrCreateAndParams({
                        input: v.connectOrCreate,
                        varName: `${varNameKey}${relationField.union ? "_" : ""}${unionTypeName}_connectOrCreate`,
                        parentVar: varName,
                        relationField,
                        refNode,
                        node,
                        context,
                        withVars,
                        callbackBucket,
                    });
                    res.creates.push(cypher);
                    res.params = { ...res.params, ...params };
                }
            });

            if (relationField.interface && value.connect) {
                const connectAndParams = createConnectAndParams({
                    withVars,
                    value: value.connect,
                    varName: `${varNameKey}${relationField.union ? "_" : ""}_connect`,
                    parentVar: varName,
                    relationField,
                    context,
                    callbackBucket,
                    refNodes,
                    labelOverride: "",
                    parentNode: node,
                });
                res.creates.push(connectAndParams[0]);
                res.params = { ...res.params, ...connectAndParams[1] };
            }

            return res;
        }

        const authorizationAndParams = createAuthorizationAfterAndParams({
            context,
            nodes: [
                {
                    variable: varName,
                    node,
                    fieldName: primitiveField?.fieldName,
                },
            ],
            operations: ["CREATE"],
        });

        if (authorizationAndParams) {
            const { cypher, params: authParams, subqueries } = authorizationAndParams;

            if (subqueries) {
                res.meta.authorizationSubqueries.push(subqueries);
            }
            res.meta.authorizationPredicates.push(cypher);
            res.params = { ...res.params, ...authParams };
        }

        if (pointField) {
            if (pointField.typeMeta.array) {
                res.creates.push(`SET ${varName}.${dbFieldName} = [p in $${varNameKey} | point(p)]`);
            } else {
                res.creates.push(`SET ${varName}.${dbFieldName} = point($${varNameKey})`);
            }

            res.params[varNameKey] = value;

            return res;
        }

        res.creates.push(`SET ${varName}.${dbFieldName} = $${varNameKey}`);
        res.params[varNameKey] = value;

        return res;
    }

    const labels = node.getLabelString(context);
    const initial = [`CREATE (${varName}${labels})`];

    const timestampedFields = node.temporalFields.filter(
        (x) => ["DateTime", "Time"].includes(x.typeMeta.name) && x.timestamps?.includes("CREATE")
    );
    timestampedFields.forEach((field) => {
        // DateTime -> datetime(); Time -> time()
        initial.push(`SET ${varName}.${field.dbPropertyName} = ${field.typeMeta.name.toLowerCase()}()`);
    });

    node.primitiveFields.forEach((field) =>
        addCallbackAndSetParam(field, varName, input, callbackBucket, initial, "CREATE")
    );

    const autogeneratedIdFields = node.primitiveFields.filter((x) => x.autogenerate);
    autogeneratedIdFields.forEach((f) => {
        initial.push(`SET ${varName}.${f.dbPropertyName} = randomUUID()`);
    });

    // eslint-disable-next-line prefer-const
    let { creates, params, meta } = Object.entries(input).reduce(reducer, {
        creates: initial,
        params: {},
        meta: {
            authStrs: [],
            authorizationPredicates: [],
            authorizationSubqueries: [],
        },
    });

    if (context.subscriptionsEnabled) {
        const eventWithMetaStr = createEventMeta({ event: "create", nodeVariable: varName, typename: node.name });
        const withStrs = [eventWithMetaStr];
        creates.push(`WITH ${withStrs.join(", ")}, ${filterMetaVariable(withVars).join(", ")}`);
    }

    const { authorizationPredicates, authorizationSubqueries } = meta;
    const authorizationAndParams = createAuthorizationAfterAndParams({
        context,
        nodes: [
            {
                variable: varName,
                node,
            },
        ],
        operations: ["CREATE"],
    });

    if (authorizationAndParams) {
        const { cypher, params: authParams, subqueries } = authorizationAndParams;
        if (subqueries) {
            authorizationSubqueries.push(subqueries);
        }
        authorizationPredicates.push(cypher);
        params = { ...params, ...authParams };
    }

    if (authorizationPredicates.length) {
        creates.push(`WITH ${withVars.join(", ")}`);
        if (authorizationSubqueries.length) {
            creates.push(...authorizationSubqueries);
            creates.push(`WITH *`);
        }
        creates.push(`WHERE ${authorizationPredicates.join(" AND ")}`);
    }

    if (includeRelationshipValidation) {
        const str = createRelationshipValidationStr({ node, context, varName });

        if (str) {
            creates.push(`WITH ${withVars.join(", ")}`);
            creates.push(str);
        }
    }

    return [creates.join("\n"), params];
}

export default createCreateAndParams;
