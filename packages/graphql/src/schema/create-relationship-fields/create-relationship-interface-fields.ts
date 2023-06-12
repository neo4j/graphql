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
import { RelationshipNestedOperationsOption } from "../../constants";

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
    const refNodes = nodes.filter((x) => rel.interface?.implementations?.includes(x.name));
    const upperFieldName = upperFirst(rel.fieldName);
    const nestedOperations = new Set(rel.nestedOperations);
    const nodeCreateInput = schemaComposer.getITC(`${sourceName}CreateInput`);
    const nodeUpdateInput = schemaComposer.getITC(`${sourceName}UpdateInput`);

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

    const updateConnectionFieldInput = schemaComposer.getOrCreateITC(
        `${sourceName}${upperFieldName}UpdateConnectionInput`,
        (tc) => {
            tc.addFields({
                ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
                node: `${rel.typeMeta.name}UpdateInput`,
            });
        }
    );

    if (
        nestedOperations.size !== 0 &&
        !(nestedOperations.size === 1 && nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE))
    ) {
        const updateFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}UpdateFieldInput`);

        if (nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
            const nodeConnectInput = schemaComposer.getOrCreateITC(`${sourceName}ConnectInput`);
            nodeConnectInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? connectFieldInput.NonNull.List : connectFieldInput,
            });
            updateFieldInput.addFields({
                connect: rel.typeMeta.array ? connectFieldInput.NonNull.List : connectFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
            const nodeDeleteInput = schemaComposer.getOrCreateITC(`${sourceName}DeleteInput`);
            nodeDeleteInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? deleteFieldInput.NonNull.List : deleteFieldInput,
            });
            updateFieldInput.addFields({
                delete: rel.typeMeta.array ? deleteFieldInput.NonNull.List : deleteFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
            const nodeDisconnectInput = schemaComposer.getOrCreateITC(`${sourceName}DisconnectInput`);
            nodeDisconnectInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
            });
            updateFieldInput.addFields({
                disconnect: rel.typeMeta.array ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
            const nodeRelationInput = schemaComposer.getOrCreateITC(`${sourceName}RelationInput`);
            nodeRelationInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
            });
            updateFieldInput.addFields({
                create: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
            updateFieldInput.addFields({
                update: updateConnectionFieldInput,
            });
        }

        updateFieldInput.addFields({
            where: `${rel.connectionPrefix}${upperFieldName}ConnectionWhere`,
        });

        nodeUpdateInput.addFields({
            [rel.fieldName]: rel.typeMeta.array ? updateFieldInput.NonNull.List : updateFieldInput,
        });
    }

    if (!rel.writeonly) {
        const baseNodeFieldArgs = {
            options: `${rel.typeMeta.name}Options`,
            where: `${rel.typeMeta.name}Where`,
        };
        const nodeFieldArgs = addDirectedArgument(baseNodeFieldArgs, rel);

        if (rel.selectableOptions.onRead) {
            composeNode.addFields({
                [rel.fieldName]: {
                    type: rel.typeMeta.pretty,
                    args: nodeFieldArgs,
                    description: rel.description,
                    directives: graphqlDirectivesToCompose(rel.otherDirectives),
                },
            });
        }
    }

    if (
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
        nestedOperations.has(RelationshipNestedOperationsOption.CREATE)
    ) {
        const nodeFieldInput = schemaComposer.getOrCreateITC(
            `${rel.connectionPrefix}${upperFieldName}FieldInput`,
            (tc) => {
                if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
                    tc.addFields({
                        create: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
                    });
                }
                if (nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
                    tc.addFields({
                        connect: rel.typeMeta.array ? connectFieldInput.NonNull.List : connectFieldInput,
                    });
                }
            }
        );

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
        if (rel.settableOptions.onCreate && !(composeNode instanceof InterfaceTypeComposer)) {
            nodeCreateInput.addFields({
                [rel.fieldName]: nodeFieldInput,
            });
        }
    }
}
