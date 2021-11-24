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
import { Context, RelationField, ConnectionField } from "../types";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import createUpdateAndParams from "./create-update-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createDeleteAndParams from "./create-delete-and-params";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";
import translateTopLevelMatch from "./translate-top-level-match";
import createRelationshipValidationStr from "./create-relationship-validation-str";
import { createConnectOrCreateAndParams } from "./connect-or-create/create-connect-or-create-and-params";

function translateUpdate({ node, context }: { node: Node; context: Context }): [string, any] {
    const { resolveTree } = context;
    const updateInput = resolveTree.args.update;
    const connectInput = resolveTree.args.connect;
    const disconnectInput = resolveTree.args.disconnect;
    const createInput = resolveTree.args.create;
    const deleteInput = resolveTree.args.delete;
    const connectOrCreateInput = resolveTree.args.connectOrCreate;
    const varName = "this";

    let matchAndWhereStr = "";
    let updateStr = "";
    const connectStrs: string[] = [];
    const disconnectStrs: string[] = [];
    const createStrs: string[] = [];
    let deleteStr = "";
    let projAuth = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};

    const topLevelMatch = translateTopLevelMatch({ node, context, varName, operation: "UPDATE" });
    matchAndWhereStr = topLevelMatch[0];
    cypherParams = { ...cypherParams, ...topLevelMatch[1] };

    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];
    let updateArgs = {};

    const mutationResponse =
        resolveTree.fieldsByTypeName[`Update${node.getPlural({ camelCase: false })}MutationResponse`];

    const nodeProjection = Object.values(mutationResponse).find(
        (field) => field.name === node.getPlural({ camelCase: true })
    );

    if (updateInput) {
        const updateAndParams = createUpdateAndParams({
            context,
            node,
            updateInput,
            varName,
            parentVar: varName,
            withVars: [varName],
            parameterPrefix: `${resolveTree.name}.args.update`,
            fromTopLevel: true,
        });
        [updateStr] = updateAndParams;
        cypherParams = {
            ...cypherParams,
            ...updateAndParams[1],
        };
        updateArgs = {
            ...updateArgs,
            ...(updateStr.includes(resolveTree.name) ? { update: updateInput } : {}),
        };
    }

    if (disconnectInput) {
        Object.entries(disconnectInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNodes: Node[] = [];

            if (relationField.union) {
                Object.keys(entry[1]).forEach((unionTypeName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            if (relationField.interface) {
                const disconnectAndParams = createDisconnectAndParams({
                    context,
                    parentVar: varName,
                    refNodes,
                    relationField,
                    value: entry[1],
                    varName: `${varName}_disconnect_${entry[0]}`,
                    withVars: [varName],
                    parentNode: node,
                    parameterPrefix: `${resolveTree.name}.args.disconnect.${entry[0]}`,
                    labelOverride: "",
                });
                disconnectStrs.push(disconnectAndParams[0]);
                cypherParams = { ...cypherParams, ...disconnectAndParams[1] };
            } else {
                refNodes.forEach((refNode) => {
                    const disconnectAndParams = createDisconnectAndParams({
                        context,
                        parentVar: varName,
                        refNodes: [refNode],
                        relationField,
                        value: relationField.union ? entry[1][refNode.name] : entry[1],
                        varName: `${varName}_disconnect_${entry[0]}${relationField.union ? `_${refNode.name}` : ""}`,
                        withVars: [varName],
                        parentNode: node,
                        parameterPrefix: `${resolveTree.name}.args.disconnect.${entry[0]}${
                            relationField.union ? `.${refNode.name}` : ""
                        }`,
                        labelOverride: relationField.union ? refNode.name : "",
                    });
                    disconnectStrs.push(disconnectAndParams[0]);
                    cypherParams = { ...cypherParams, ...disconnectAndParams[1] };
                });
            }
        });

        updateArgs = {
            ...updateArgs,
            disconnect: disconnectInput,
        };
    }

    if (connectInput) {
        Object.entries(connectInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => entry[0] === x.fieldName) as RelationField;

            const refNodes: Node[] = [];

            if (relationField.union) {
                Object.keys(entry[1]).forEach((unionTypeName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            if (relationField.interface) {
                const connectAndParams = createConnectAndParams({
                    context,
                    parentVar: varName,
                    refNodes,
                    relationField,
                    value: entry[1],
                    varName: `${varName}_connect_${entry[0]}`,
                    withVars: [varName],
                    parentNode: node,
                    labelOverride: "",
                });
                connectStrs.push(connectAndParams[0]);
                cypherParams = { ...cypherParams, ...connectAndParams[1] };
            } else {
                refNodes.forEach((refNode) => {
                    const connectAndParams = createConnectAndParams({
                        context,
                        parentVar: varName,
                        refNodes: [refNode],
                        relationField,
                        value: relationField.union ? entry[1][refNode.name] : entry[1],
                        varName: `${varName}_connect_${entry[0]}${relationField.union ? `_${refNode.name}` : ""}`,
                        withVars: [varName],
                        parentNode: node,
                        labelOverride: relationField.union ? refNode.name : "",
                    });
                    connectStrs.push(connectAndParams[0]);
                    cypherParams = { ...cypherParams, ...connectAndParams[1] };
                });
            }
        });
    }

    if (createInput) {
        Object.entries(createInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => entry[0] === x.fieldName) as RelationField;

            const refNodes: Node[] = [];

            if (relationField.union) {
                Object.keys(entry[1]).forEach((unionTypeName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            refNodes.forEach((refNode) => {
                let v = relationField.union ? entry[1][refNode.name] : entry[1];

                if (relationField.interface) {
                    if (relationField.typeMeta.array) {
                        v = entry[1]
                            .filter((c) => Object.keys(c.node).includes(refNode.name))
                            .map((c) => ({ edge: c.edge, node: c.node[refNode.name] }));

                        if (!v.length) {
                            return;
                        }
                    } else {
                        if (!entry[1].node[refNode.name]) {
                            return;
                        }
                        v = { edge: entry[1].edge, node: entry[1].node[refNode.name] };
                    }
                }

                const creates = relationField.typeMeta.array ? v : [v];
                creates.forEach((create, index) => {
                    const baseName = `${varName}_create_${entry[0]}${
                        relationField.union || relationField.interface ? `_${refNode.name}` : ""
                    }${index}`;
                    const nodeName = `${baseName}_node${relationField.interface ? `_${refNode.name}` : ""}`;
                    const propertiesName = `${baseName}_relationship`;
                    const relTypeStr = `[${relationField.properties ? propertiesName : ""}:${relationField.type}]`;

                    const createAndParams = createCreateAndParams({
                        context,
                        node: refNode,
                        input: create.node,
                        varName: nodeName,
                        withVars: [varName, nodeName],
                    });
                    createStrs.push(createAndParams[0]);
                    cypherParams = { ...cypherParams, ...createAndParams[1] };
                    createStrs.push(`MERGE (${varName})${inStr}${relTypeStr}${outStr}(${nodeName})`);

                    if (relationField.properties) {
                        const relationship = (context.neoSchema.relationships.find(
                            (x) => x.properties === relationField.properties
                        ) as unknown) as Relationship;

                        const setA = createSetRelationshipPropertiesAndParams({
                            properties: create.edge ?? {},
                            varName: propertiesName,
                            relationship,
                            operation: "CREATE",
                        });
                        createStrs.push(setA[0]);
                        cypherParams = { ...cypherParams, ...setA[1] };
                    }
                });
            });
        });
    }

    if (deleteInput) {
        const deleteAndParams = createDeleteAndParams({
            context,
            node,
            deleteInput,
            varName: `${varName}_delete`,
            parentVar: varName,
            withVars: [varName],
            parameterPrefix: `${resolveTree.name}.args.delete`,
        });
        [deleteStr] = deleteAndParams;
        cypherParams = {
            ...cypherParams,
            ...deleteAndParams[1],
        };
        updateArgs = {
            ...updateArgs,
            ...(deleteStr.includes(resolveTree.name) ? { delete: deleteInput } : {}),
        };
    }

    if (connectOrCreateInput) {
        Object.entries(connectOrCreateInput).forEach(([key, input]) => {
            const relationField = node.relationFields.find((x) => key === x.fieldName) as RelationField;

            const refNodes: Node[] = [];

            if (relationField.union) {
                Object.keys(input).forEach((unionTypeName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            refNodes.forEach((refNode) => {
                const connectAndParams = createConnectOrCreateAndParams({
                    input: input[refNode.name] || input, // Deals with different input from update -> connectOrCreate
                    varName: `${varName}_connectOrCreate_${key}${relationField.union ? `_${refNode.name}` : ""}`,
                    parentVar: varName,
                    relationField,
                    refNode,
                    context,
                });
                connectStrs.push(connectAndParams[0]);
                cypherParams = { ...cypherParams, ...connectAndParams[1] };
            });
        });
    }

    if (nodeProjection?.fieldsByTypeName) {
        const projection = createProjectionAndParams({
            node,
            context,
            fieldsByTypeName: nodeProjection.fieldsByTypeName,
            varName,
        });
        [projStr] = projection;
        cypherParams = { ...cypherParams, ...projection[1] };
        if (projection[2]?.authValidateStrs?.length) {
            projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        }

        if (projection[2]?.connectionFields?.length) {
            projection[2].connectionFields.forEach((connectionResolveTree) => {
                const connectionField = node.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: varName,
                });
                connectionStrs.push(connection[0]);
                cypherParams = { ...cypherParams, ...connection[1] };
            });
        }

        if (projection[2]?.interfaceFields?.length) {
            projection[2].interfaceFields.forEach((interfaceResolveTree) => {
                const relationshipField = node.relationFields.find(
                    (x) => x.fieldName === interfaceResolveTree.name
                ) as RelationField;
                const interfaceProjection = createInterfaceProjectionAndParams({
                    resolveTree: interfaceResolveTree,
                    field: relationshipField,
                    context,
                    node,
                    nodeVariable: varName,
                });
                interfaceStrs.push(interfaceProjection.cypher);
                cypherParams = { ...cypherParams, ...interfaceProjection.params };
            });
        }
    }

    const relationshipValidationStr = createRelationshipValidationStr({ node, context, varName });

    const returnStatement = nodeProjection
        ? `RETURN ${varName} ${projStr} AS ${varName}`
        : `RETURN 'Query cannot conclude with CALL'`;

    const cypher = [
        matchAndWhereStr,
        updateStr,
        connectStrs.join("\n"),
        disconnectStrs.join("\n"),
        createStrs.join("\n"),
        deleteStr,
        ...(connectionStrs.length || projAuth ? [`WITH ${varName}`] : []), // When FOREACH is the last line of update 'Neo4jError: WITH is required between FOREACH and CALL'
        ...(projAuth ? [projAuth] : []),
        ...(relationshipValidationStr ? [`WITH ${varName}`, relationshipValidationStr] : []),
        ...connectionStrs,
        ...interfaceStrs,
        returnStatement,
    ];

    return [
        cypher.filter(Boolean).join("\n"),
        { ...cypherParams, ...(Object.keys(updateArgs).length ? { [resolveTree.name]: { args: updateArgs } } : {}) },
    ];
}

export default translateUpdate;
