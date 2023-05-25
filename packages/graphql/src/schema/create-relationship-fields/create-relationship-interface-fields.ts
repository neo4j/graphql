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

import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceTypeComposer, upperFirst } from "graphql-compose";
import type { Node } from "../../classes";
import type { RelationField } from "../../types";
import { addDirectedArgument } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";

export function createRelationshipInterfaceFields({
    nodes,
    rel,
    composeNode,
    schemaComposer,
    sourceName,
    hasNonGeneratedProperties,
    anyNonNullRelProperties,
}: {
    nodes: Node[];
    rel: RelationField;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    sourceName: string;
    hasNonGeneratedProperties: boolean;
    anyNonNullRelProperties: boolean;
}) {
    const nodeCreateInput = schemaComposer.getITC(`${sourceName}CreateInput`);
    const nodeUpdateInput = schemaComposer.getITC(`${sourceName}UpdateInput`);
    const nodeConnectInput = schemaComposer.getOrCreateITC(`${sourceName}ConnectInput`);
    const nodeDeleteInput = schemaComposer.getOrCreateITC(`${sourceName}DeleteInput`);
    const nodeDisconnectInput = schemaComposer.getOrCreateITC(`${sourceName}DisconnectInput`);
    const nodeRelationInput = schemaComposer.getOrCreateITC(`${sourceName}RelationInput`);

    const refNodes = nodes.filter((x) => rel.interface?.implementations?.includes(x.name));
    const upperFieldName = upperFirst(rel.fieldName);

    if (!rel.writeonly) {
        const baseNodeFieldArgs = {
            options: `${rel.typeMeta.name}Options`,
            where: `${rel.typeMeta.name}Where`,
        };
        const nodeFieldArgs = addDirectedArgument(baseNodeFieldArgs, rel);

        composeNode.addFields({
            [rel.fieldName]: {
                type: rel.typeMeta.pretty,
                args: nodeFieldArgs,
                description: rel.description,
                directives: graphqlDirectivesToCompose(rel.otherDirectives),
            },
        });
    }

    const connectWhere = schemaComposer.getOrCreateITC(`${rel.typeMeta.name}ConnectWhere`, (tc) => {
        tc.addFields({
            node: `${rel.typeMeta.name}Where!`,
        });
    });

    const connectFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}ConnectFieldInput`, (tc) => {
        tc.addFields({
            ...(schemaComposer.has(`${rel.typeMeta.name}ConnectInput`)
                ? { connect: `${rel.typeMeta.name}ConnectInput` }
                : {}),
            ...(hasNonGeneratedProperties
                ? { edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
                : {}),
            where: connectWhere,
        });
    });

    const deleteFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}DeleteFieldInput`, (tc) => {
        tc.addFields({
            ...(schemaComposer.has(`${rel.typeMeta.name}DeleteInput`)
                ? { delete: `${rel.typeMeta.name}DeleteInput` }
                : {}),
            where: `${rel.connectionPrefix}${upperFieldName}ConnectionWhere`,
        });
    });

    const disconnectFieldInput = schemaComposer.getOrCreateITC(
        `${sourceName}${upperFieldName}DisconnectFieldInput`,
        (tc) => {
            tc.addFields({
                ...(schemaComposer.has(`${rel.typeMeta.name}DisconnectInput`)
                    ? { disconnect: `${rel.typeMeta.name}DisconnectInput` }
                    : {}),
                where: `${rel.connectionPrefix}${upperFieldName}ConnectionWhere`,
            });
        }
    );

    const createFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}CreateFieldInput`, (tc) => {
        tc.addFields({
            node: `${rel.typeMeta.name}CreateInput!`,
        });
        if (hasNonGeneratedProperties) {
            tc.addFields({
                edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}`,
            });
        }
    });

    schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}UpdateConnectionInput`, (tc) => {
        tc.addFields({
            ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
            node: `${rel.typeMeta.name}UpdateInput`,
        });
    });

    const updateFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}UpdateFieldInput`, (tc) => {
        tc.addFields({
            connect: rel.typeMeta.array
                ? `[${sourceName}${upperFieldName}ConnectFieldInput!]`
                : `${sourceName}${upperFieldName}ConnectFieldInput`,
            create: rel.typeMeta.array
                ? `[${sourceName}${upperFieldName}CreateFieldInput!]`
                : `${sourceName}${upperFieldName}CreateFieldInput`,
            delete: rel.typeMeta.array
                ? `[${sourceName}${upperFieldName}DeleteFieldInput!]`
                : `${sourceName}${upperFieldName}DeleteFieldInput`,
            disconnect: rel.typeMeta.array
                ? `[${sourceName}${upperFieldName}DisconnectFieldInput!]`
                : `${sourceName}${upperFieldName}DisconnectFieldInput`,
            update: `${sourceName}${upperFieldName}UpdateConnectionInput`,
            where: `${rel.connectionPrefix}${upperFieldName}ConnectionWhere`,
        });
    });

    const nodeFieldInput = schemaComposer.getOrCreateITC(`${rel.connectionPrefix}${upperFieldName}FieldInput`, (tc) => {
        tc.addFields({
            create: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
            connect: rel.typeMeta.array ? connectFieldInput.NonNull.List : connectFieldInput,
        });
    });

    refNodes.forEach((n) => {
        const createName = `${sourceName}${upperFieldName}${n.name}CreateFieldInput`;
        if (!schemaComposer.has(createName)) {
            schemaComposer.createInputTC({
                name: createName,
                fields: {
                    node: `${n.name}CreateInput!`,
                    ...(hasNonGeneratedProperties
                        ? { edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
                        : {}),
                },
            });
        }
    });

    // Interface CreateInput does not require relationship input fields
    // These are specified on the concrete nodes.
    if (!(composeNode instanceof InterfaceTypeComposer)) {
        nodeCreateInput.addFields({
            [rel.fieldName]: nodeFieldInput,
        });
    }

    nodeConnectInput.addFields({
        [rel.fieldName]: rel.typeMeta.array ? connectFieldInput.NonNull.List : connectFieldInput,
    });

    nodeDeleteInput.addFields({
        [rel.fieldName]: rel.typeMeta.array ? deleteFieldInput.NonNull.List : deleteFieldInput,
    });

    nodeDisconnectInput.addFields({
        [rel.fieldName]: rel.typeMeta.array ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
    });

    nodeRelationInput.addFields({
        [rel.fieldName]: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
    });

    nodeUpdateInput.addFields({
        [rel.fieldName]: rel.typeMeta.array ? updateFieldInput.NonNull.List : updateFieldInput,
    });
}
