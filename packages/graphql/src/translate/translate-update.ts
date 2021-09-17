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
import { Context, GraphQLWhereArg, RelationField, ConnectionField } from "../types";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import createAuthAndParams from "./create-auth-and-params";
import createUpdateAndParams from "./create-update-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createDeleteAndParams from "./create-delete-and-params";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";

function translateUpdate({ node, context }: { node: Node; context: Context }): [string, any] {
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const updateInput = resolveTree.args.update;
    const connectInput = resolveTree.args.connect;
    const disconnectInput = resolveTree.args.disconnect;
    const createInput = resolveTree.args.create;
    const deleteInput = resolveTree.args.delete;
    const varName = "this";
    const labels = node.labelString;
    const matchStr = `MATCH (${varName}${labels})`;
    let whereStr = "";
    let updateStr = "";
    const connectStrs: string[] = [];
    const disconnectStrs: string[] = [];
    const createStrs: string[] = [];
    let deleteStr = "";
    let projAuth = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    const connectionStrs: string[] = [];
    let updateArgs = {};

    // Due to potential aliasing of returned object in response we look through fields of UpdateMutationResponse
    // and find field where field.name ~ node.name which exists by construction
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { fieldsByTypeName } = Object.values(
        resolveTree.fieldsByTypeName[`Update${node.getPlural(false)}MutationResponse`]
    ).find((field) => field.name === node.getPlural(true))!;

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
        whereStr = `WHERE ${whereStrs.join(" AND ")}`;
    }

    if (updateInput) {
        const updateAndParams = createUpdateAndParams({
            context,
            node,
            updateInput,
            varName,
            parentVar: varName,
            withVars: [varName],
            parameterPrefix: `${resolveTree.name}.args.update`,
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
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }
            refNodes.forEach((refNode) => {
                const disconnectAndParams = createDisconnectAndParams({
                    context,
                    parentVar: varName,
                    refNode,
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
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }
            refNodes.forEach((refNode) => {
                const connectAndParams = createConnectAndParams({
                    context,
                    parentVar: varName,
                    refNode,
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
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            refNodes.forEach((refNode) => {
                const v = relationField.union ? entry[1][refNode.name] : entry[1];
                const creates = relationField.typeMeta.array ? v : [v];
                creates.forEach((create, index) => {
                    const baseName = `${varName}_create_${entry[0]}${
                        relationField.union ? `_${refNode.name}` : ""
                    }${index}`;
                    const nodeName = `${baseName}_node`;
                    const propertiesName = `${baseName}_relationship`;
                    const relTypeStr = `[${create.edge ? propertiesName : ""}:${relationField.type}]`;

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

                    if (create.edge) {
                        const relationship = (context.neoSchema.relationships.find(
                            (x) => x.properties === relationField.properties
                        ) as unknown) as Relationship;

                        const setA = createSetRelationshipPropertiesAndParams({
                            properties: create.edge,
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

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
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

    const cypher = [
        matchStr,
        whereStr,
        updateStr,
        connectStrs.join("\n"),
        disconnectStrs.join("\n"),
        createStrs.join("\n"),
        deleteStr,
        ...(connectionStrs.length || projAuth ? [`WITH ${varName}`] : []), // When FOREACH is the last line of update 'Neo4jError: WITH is required between FOREACH and CALL'
        ...(projAuth ? [projAuth] : []),
        ...connectionStrs,
        `RETURN ${varName} ${projStr} AS ${varName}`,
    ];

    return [
        cypher.filter(Boolean).join("\n"),
        { ...cypherParams, ...(Object.keys(updateArgs).length ? { [resolveTree.name]: { args: updateArgs } } : {}) },
    ];
}

export default translateUpdate;
