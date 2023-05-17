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

import type { InputTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceTypeComposer, upperFirst } from "graphql-compose";
import type { Node } from "../../classes";
import type { RelationField } from "../../types";
import { DEPRECATE_NOT } from "../constants";
import { addDirectedArgument } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";
import { createConnectOrCreateField } from "./create-connect-or-create-field";

export function createRelationshipUnionFields({
    nodes,
    rel,
    composeNode,
    sourceName,
    schemaComposer,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
}: {
    nodes: Node[];
    rel: RelationField;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    sourceName: string;
    schemaComposer: SchemaComposer;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
}) {
    const nodeCreateInput = schemaComposer.getITC(`${sourceName}CreateInput`);
    const nodeUpdateInput = schemaComposer.getITC(`${sourceName}UpdateInput`);
    const nodeConnectInput = schemaComposer.getOrCreateITC(`${sourceName}ConnectInput`);
    const nodeDeleteInput = schemaComposer.getOrCreateITC(`${sourceName}DeleteInput`);
    const nodeDisconnectInput = schemaComposer.getOrCreateITC(`${sourceName}DisconnectInput`);
    const nodeRelationInput = schemaComposer.getOrCreateITC(`${sourceName}RelationInput`);

    const refNodes = nodes.filter((x) => rel.union?.nodes?.includes(x.name));

    if (!rel.writeonly) {
        const baseNodeFieldArgs = {
            options: "QueryOptions",
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

    const upperFieldName = upperFirst(rel.fieldName);
    const upperNodeName = upperFirst(sourceName);
    const typePrefix = `${upperNodeName}${upperFieldName}`;

    const [unionConnectInput, unionCreateInput, unionDeleteInput, unionDisconnectInput, unionUpdateInput] = [
        "Connect",
        "Create",
        "Delete",
        "Disconnect",
        "Update",
    ].map((operation) =>
        schemaComposer.createInputTC({
            name: `${typePrefix}${operation}Input`,
            fields: {},
        })
    ) as [InputTypeComposer, InputTypeComposer, InputTypeComposer, InputTypeComposer, InputTypeComposer];

    const unionCreateFieldInput = schemaComposer.createInputTC({
        name: `${typePrefix}CreateFieldInput`,
        fields: {},
    });

    refNodes.forEach((n) => {
        const unionPrefix = `${sourceName}${upperFieldName}${n.name}`;
        const updateField = `${n.name}UpdateInput`;
        const nodeFieldInputName = `${unionPrefix}FieldInput`;
        const whereName = `${unionPrefix}ConnectionWhere`;

        const deleteName = `${unionPrefix}DeleteFieldInput`;
        const deleteField = rel.typeMeta.array ? `[${deleteName}!]` : `${deleteName}`;

        const disconnectName = `${unionPrefix}DisconnectFieldInput`;
        const disconnect = rel.typeMeta.array ? `[${disconnectName}!]` : `${disconnectName}`;

        const connectionUpdateInputName = `${unionPrefix}UpdateConnectionInput`;

        const createName = `${sourceName}${upperFirst(rel.fieldName)}${n.name}CreateFieldInput`;
        const create = rel.typeMeta.array ? `[${createName}!]` : createName;
        if (!schemaComposer.has(createName)) {
            schemaComposer.createInputTC({
                name: createName,
                fields: {
                    node: `${n.name}CreateInput!`,
                    ...(hasNonGeneratedProperties
                        ? {
                              edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
                          }
                        : {}),
                },
            });

            unionCreateInput.addFields({
                [n.name]: nodeFieldInputName,
            });

            unionCreateFieldInput.addFields({
                [n.name]: rel.typeMeta.array ? `[${createName}!]` : createName,
            });
        }

        const connectWhereName = `${n.name}ConnectWhere`;
        if (!schemaComposer.has(connectWhereName)) {
            schemaComposer.createInputTC({
                name: connectWhereName,
                fields: {
                    node: `${n.name}Where!`,
                },
            });
        }

        const connectName = `${unionPrefix}ConnectFieldInput`;
        const connect = rel.typeMeta.array ? `[${connectName}!]` : `${connectName}`;
        if (!schemaComposer.has(connectName)) {
            schemaComposer.createInputTC({
                name: connectName,
                fields: {
                    where: connectWhereName,
                    ...(n.relationFields.length
                        ? {
                              connect: rel.typeMeta.array ? `[${n.name}ConnectInput!]` : `${n.name}ConnectInput`,
                          }
                        : {}),
                    ...(hasNonGeneratedProperties
                        ? {
                              edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
                          }
                        : {}),
                },
            });

            unionConnectInput.addFields({
                [n.name]: connect,
            });
        }

        const updateFields: Record<string, string> = {
            where: whereName,
            update: connectionUpdateInputName,
            connect,
            disconnect: rel.typeMeta.array ? `[${disconnectName}!]` : disconnectName,
            create,
            delete: rel.typeMeta.array ? `[${deleteName}!]` : deleteName,
        };

        const connectOrCreate = createConnectOrCreateField({
            relationField: rel,
            node: n,
            schemaComposer,
            hasNonGeneratedProperties,
            hasNonNullNonGeneratedProperties,
        });

        if (connectOrCreate) {
            updateFields.connectOrCreate = connectOrCreate;
        }

        const updateName = `${unionPrefix}UpdateFieldInput`;
        const update = rel.typeMeta.array ? `[${updateName}!]` : updateName;
        if (!schemaComposer.has(updateName)) {
            schemaComposer.createInputTC({
                name: updateName,
                fields: updateFields,
            });

            unionUpdateInput.addFields({
                [n.name]: update,
            });
        }

        schemaComposer.createInputTC({
            name: connectionUpdateInputName,
            fields: {
                ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
                node: updateField,
            },
        });

        const fieldInputFields: Record<string, string> = {
            create,
            connect,
        };

        if (connectOrCreate) {
            fieldInputFields.connectOrCreate = connectOrCreate;
        }

        schemaComposer.createInputTC({
            name: nodeFieldInputName,
            fields: fieldInputFields,
        });

        schemaComposer.createInputTC({
            name: whereName,
            fields: {
                node: `${n.name}Where`,
                node_NOT: {
                    type: `${n.name}Where`,
                    directives: [DEPRECATE_NOT],
                },
                AND: `[${whereName}!]`,
                OR: `[${whereName}!]`,
                NOT: whereName,
                ...(rel.properties
                    ? {
                          edge: `${rel.properties}Where`,
                          edge_NOT: {
                              type: `${rel.properties}Where`,
                              directives: [DEPRECATE_NOT],
                          },
                      }
                    : {}),
            },
        });

        if (!schemaComposer.has(deleteName)) {
            schemaComposer.createInputTC({
                name: deleteName,
                fields: {
                    where: whereName,
                    ...(n.relationFields.length
                        ? {
                              delete: `${n.name}DeleteInput`,
                          }
                        : {}),
                },
            });

            unionDeleteInput.addFields({
                [n.name]: deleteField,
            });
        }

        if (!schemaComposer.has(disconnectName)) {
            schemaComposer.createInputTC({
                name: disconnectName,
                fields: {
                    where: whereName,
                    ...(n.relationFields.length
                        ? {
                              disconnect: `${n.name}DisconnectInput`,
                          }
                        : {}),
                },
            });

            unionDisconnectInput.addFields({
                [n.name]: disconnect,
            });
        }

        if (n.uniqueFields.length) {
            // TODO: merge with createTopLevelConnectOrCreateInput
            const nodeConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
                `${sourceName}ConnectOrCreateInput`
            );

            const nodeRelationConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}ConnectOrCreateInput`
            );

            nodeConnectOrCreateInput.addFields({
                [rel.fieldName]: nodeRelationConnectOrCreateInput,
            });

            const nodeFieldConnectOrCreateInputName = `${sourceName}${upperFirst(rel.fieldName)}${
                n.name
            }ConnectOrCreateFieldInput`;

            nodeRelationConnectOrCreateInput.addFields({
                [n.name]: rel.typeMeta.array
                    ? `[${nodeFieldConnectOrCreateInputName}!]`
                    : nodeFieldConnectOrCreateInputName,
            });
        }
    });

    if (!(composeNode instanceof InterfaceTypeComposer)) {
        nodeCreateInput.addFields({
            [rel.fieldName]: unionCreateInput,
        });
    }

    nodeRelationInput.addFields({
        [rel.fieldName]: unionCreateFieldInput,
    });

    nodeUpdateInput.addFields({
        [rel.fieldName]: unionUpdateInput,
    });

    nodeConnectInput.addFields({
        [rel.fieldName]: unionConnectInput,
    });

    nodeDeleteInput.addFields({
        [rel.fieldName]: unionDeleteInput,
    });

    nodeDisconnectInput.addFields({
        [rel.fieldName]: unionDisconnectInput,
    });
}
