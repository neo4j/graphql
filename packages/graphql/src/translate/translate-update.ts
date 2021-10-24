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
import WithProjector from "../classes/WithProjector";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { ConnectionField, Context, GraphQLWhereArg, RelationField } from "../types";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createAuthAndParams from "./create-auth-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createCreateAndParams from "./create-create-and-params";
import createDeleteAndParams from "./create-delete-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";
import createUpdateAndParams from "./create-update-and-params";
import createWhereAndParams from "./create-where-and-params";

function translateUpdate({ node, context }: { node: Node; context: Context }): [string, any] {
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const updateInput = resolveTree.args.update;
    const connectInput = resolveTree.args.connect;
    const disconnectInput = resolveTree.args.disconnect;
    const createInput = resolveTree.args.create;
    const deleteInput = resolveTree.args.delete;
    const varName = "this";
    const labels = node.getLabelString(context);
    const matchStr = `MATCH (${varName}${labels})`;

    const updateStrs: string[] = [
        matchStr,
    ];

    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    let updateArgs = {};

    const withProjector = new WithProjector({ variables: [ varName ] });

    // Due to potential aliasing of returned object in response we look through fields of UpdateMutationResponse
    // and find field where field.name ~ node.name which exists by construction
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { fieldsByTypeName } = Object.values(
        resolveTree.fieldsByTypeName[`Update${node.getPlural({ camelCase: false })}MutationResponse`]
    ).find((field) => field.name === node.getPlural({ camelCase: true }))!;

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName,
    });

    cypherParams = { ...cypherParams, ...projection[1] };

    let projAuth: string | undefined;
    if (projection[2]?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

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
        operation: "UPDATE",
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        updateStrs.push(`WHERE ${whereStrs.join(" AND ")}`);
    }

    if (updateInput) {

        const updateAndParams = createUpdateAndParams({
            context,
            node,
            updateInput,
            varName,
            parentVar: varName,
            withProjector,
            parameterPrefix: `${resolveTree.name}.args.update`,
        });
        const [updateStr] = updateAndParams;
        updateStrs.push(updateStr);

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
                    withProjector,
                    parentNode: node,
                    parameterPrefix: `${resolveTree.name}.args.disconnect.${entry[0]}`,
                    labelOverride: "",
                });
                updateStrs.push(...disconnectAndParams[0].split('\n'));
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
                        withProjector,
                        parentNode: node,
                        parameterPrefix: `${resolveTree.name}.args.disconnect.${entry[0]}${
                            relationField.union ? `.${refNode.name}` : ""
                        }`,
                        labelOverride: relationField.union ? refNode.name : "",
                    });
                    updateStrs.push(disconnectAndParams[0]);
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
                    withProjector,
                    parentNode: node,
                    labelOverride: "",
                });
                updateStrs.push(connectAndParams[0]);
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
                        withProjector,
                        parentNode: node,
                        labelOverride: relationField.union ? refNode.name : "",
                    });
                    updateStrs.push(connectAndParams[0]);
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
                    withProjector.addVariable(nodeName);
                    const createAndParams = createCreateAndParams({
                        context,
                        node: refNode,
                        input: create.node,
                        varName: nodeName,
                        withProjector,
                    });
                    updateStrs.push(createAndParams[0]);
                    updateStrs.push(withProjector.nextWith());
                    cypherParams = { ...cypherParams, ...createAndParams[1] };
                    updateStrs.push(`MERGE (${varName})${inStr}${relTypeStr}${outStr}(${nodeName})`);
                    withProjector.removeVariable(nodeName);
                    

                    let relationship: Relationship | undefined;
                    if (relationField.properties) {
                        relationship = (context.neoSchema.relationships.find(
                            (x) => x.properties === relationField.properties
                        ) as unknown) as Relationship;

                        const setA = createSetRelationshipPropertiesAndParams({
                            properties: create.edge ?? {},
                            varName: propertiesName,
                            relationship,
                            operation: "CREATE",
                        });
                        updateStrs.push(setA[0]);
                        cypherParams = { ...cypherParams, ...setA[1] };
                    }

                    withProjector.markMutationMeta({
                        type: 'Connected',
                        idVar: `id(${ nodeName })`,
                        name: node.name,

                        toIDVar: `id(${ varName })`,
                        toName: refNode.name,
                        relationshipName: relationField.type,
                        relationshipIDVar: relationField.properties ? `id(${ propertiesName })` : undefined,

                        propertiesVar: relationField.properties ? propertiesName : undefined,
                    });

                    updateStrs.push(withProjector.nextWith());

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
            withProjector,
            parameterPrefix: `${resolveTree.name}.args.delete`,
        });
        const [deleteStr] = deleteAndParams;
        updateStrs.push(...deleteStr.split('\n'));
        cypherParams = {
            ...cypherParams,
            ...deleteAndParams[1],
        };
        updateArgs = {
            ...updateArgs,
            ...(deleteStr.includes(resolveTree.name) ? { delete: deleteInput } : {}),
        };
    }

    if (projAuth) {
        updateStrs.push(projAuth);
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
                // withProjector,
            });
            updateStrs.push(connection[0]);
            cypherParams = { ...cypherParams, ...connection[1] };
        });
    }

    const withInterfaces: string[] = [];
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
                withProjector,
            });
            updateStrs.push(...interfaceProjection.cypher.split('\n'));
            cypherParams = { ...cypherParams, ...interfaceProjection.params };
            withInterfaces.push(interfaceResolveTree.name);
        });
    }

    withInterfaces.forEach((name) => withProjector.removeVariable(name));

    const [projStr] = projection;
    const cypher = [
        ...updateStrs,
        // ...(connectionStrs.length || projAuth ? [`WITH ${varName}`] : []), // When FOREACH is the last line of update 'Neo4jError: WITH is required between FOREACH and CALL'
        withProjector.nextReturn([{
            initialVariable: varName,
            str: projStr,
        }], {}),
    ];

    return [
        cypher.filter(Boolean).join("\n"),
        { ...cypherParams, ...(Object.keys(updateArgs).length ? { [resolveTree.name]: { args: updateArgs } } : {}) },
    ];
}

export default translateUpdate;
