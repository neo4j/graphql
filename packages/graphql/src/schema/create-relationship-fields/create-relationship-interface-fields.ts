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

import type { DirectiveNode } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceTypeComposer, upperFirst } from "graphql-compose";
import type { Node } from "../../classes";
import { RelationshipNestedOperationsOption } from "../../constants";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationField } from "../../types";
import { addDirectedArgument, addDirectedArgument2 } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";

export function createRelationshipInterfaceFields({
    nodes,
    rel,
    composeNode,
    schemaComposer,
    sourceName,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
}: {
    nodes: Node[];
    rel: RelationField;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    sourceName: string;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
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
        if (schemaComposer.has(`${rel.typeMeta.name}ConnectInput`)) {
            tc.addFields({ connect: `${rel.typeMeta.name}ConnectInput` });
        }

        if (hasNonGeneratedProperties) {
            tc.addFields({ edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` });
        }

        tc.addFields({ where: connectWhere });
    });

    const deleteFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}DeleteFieldInput`, (tc) => {
        if (schemaComposer.has(`${rel.typeMeta.name}DeleteInput`)) {
            tc.addFields({ delete: `${rel.typeMeta.name}DeleteInput` });
        }

        tc.addFields({ where: `${rel.connectionPrefix}${upperFieldName}ConnectionWhere` });
    });

    const disconnectFieldInput = schemaComposer.getOrCreateITC(
        `${sourceName}${upperFieldName}DisconnectFieldInput`,
        (tc) => {
            if (schemaComposer.has(`${rel.typeMeta.name}DisconnectInput`)) {
                tc.addFields({ disconnect: `${rel.typeMeta.name}DisconnectInput` });
            }

            tc.addFields({ where: `${rel.connectionPrefix}${upperFieldName}ConnectionWhere` });
        }
    );

    const createFieldInput = schemaComposer.getOrCreateITC(`${sourceName}${upperFieldName}CreateFieldInput`, (tc) => {
        tc.addFields({
            node: `${rel.typeMeta.name}CreateInput!`,
        });
        if (hasNonGeneratedProperties) {
            tc.addFields({
                edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
            });
        }
    });

    const updateConnectionFieldInput = schemaComposer.getOrCreateITC(
        `${sourceName}${upperFieldName}UpdateConnectionInput`,
        (tc) => {
            if (hasNonGeneratedProperties) {
                tc.addFields({ edge: `${rel.properties}UpdateInput` });
            }
            tc.addFields({ node: `${rel.typeMeta.name}UpdateInput` });
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

        if (rel.settableOptions.onUpdate) {
            nodeUpdateInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? updateFieldInput.NonNull.List : updateFieldInput,
            });
        }
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
                schemaComposer.getOrCreateITC(createName, (tc) => {
                    tc.addFields({ node: `${n.name}CreateInput!` });

                    if (hasNonGeneratedProperties) {
                        tc.addFields({
                            edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
                        });
                    }
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

export function createRelationshipInterfaceFields2({
    relationship,
    composeNode,
    schemaComposer,
    hasNonGeneratedProperties,
    userDefinedFieldDirectives,
}: {
    relationship: RelationshipAdapter;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    hasNonGeneratedProperties: boolean;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}) {
    const refNodes = (relationship.target as InterfaceEntityAdapter).concreteEntities;

    // TODO: We need to add operations to InterfaceEntityAdapter
    const sourceAdapter = relationship.source as ConcreteEntityAdapter | InterfaceEntityAdapter;
    const nestedOperations = new Set(relationship.nestedOperations);
    const sourceCreateInput = schemaComposer.getITC(`${sourceAdapter.name}CreateInput`);
    const sourceUpdateInput = schemaComposer.getITC(`${sourceAdapter.name}UpdateInput`);

    const connectWhere = schemaComposer.getOrCreateITC(`${relationship.target.name}ConnectWhere`, (tc) => {
        tc.addFields({
            node: `${relationship.target.name}Where!`,
        });
    });

    const connectFieldInput = schemaComposer.getOrCreateITC(relationship.connectFieldInputTypeName, (tc) => {
        if (schemaComposer.has(`${relationship.target.name}ConnectInput`)) {
            tc.addFields({ connect: `${relationship.target.name}ConnectInput` });
        }

        if (hasNonGeneratedProperties) {
            tc.addFields({ edge: relationship.edgeCreateInputTypeName });
        }

        tc.addFields({ where: connectWhere });
    });

    const deleteFieldInput = schemaComposer.getOrCreateITC(relationship.deleteFieldInputTypeName, (tc) => {
        if (schemaComposer.has(`${relationship.target.name}DeleteInput`)) {
            tc.addFields({ delete: `${relationship.target.name}DeleteInput` });
        }

        tc.addFields({ where: relationship.connectionWhereTypename });
    });

    const disconnectFieldInput = schemaComposer.getOrCreateITC(relationship.disconnectFieldInputTypeName, (tc) => {
        if (schemaComposer.has(`${relationship.target.name}DisconnectInput`)) {
            tc.addFields({ disconnect: `${relationship.target.name}DisconnectInput` });
        }

        tc.addFields({ where: relationship.connectionWhereTypename });
    });

    const createFieldInput = schemaComposer.getOrCreateITC(relationship.createFieldInputTypeName, (tc) => {
        tc.addFields({
            node: `${relationship.target.name}CreateInput!`,
        });
        if (hasNonGeneratedProperties) {
            tc.addFields({
                edge: relationship.edgeCreateInputTypeName,
            });
        }
    });

    const updateConnectionFieldInput = schemaComposer.getOrCreateITC(
        relationship.updateConnectionInputTypename,
        (tc) => {
            if (hasNonGeneratedProperties) {
                tc.addFields({ edge: relationship.edgeUpdateInputTypeName });
            }
            tc.addFields({ node: `${relationship.target.name}UpdateInput` });
        }
    );

    if (
        nestedOperations.size !== 0 &&
        !(nestedOperations.size === 1 && nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE))
    ) {
        const updateFieldInput = schemaComposer.getOrCreateITC(relationship.updateFieldInputTypeName);

        if (nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
            const nodeConnectInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}ConnectInput`);
            nodeConnectInput.addFields({
                [relationship.name]: relationship.isList ? connectFieldInput.NonNull.List : connectFieldInput,
            });
            updateFieldInput.addFields({
                connect: relationship.isList ? connectFieldInput.NonNull.List : connectFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.DELETE)) {
            const nodeDeleteInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}DeleteInput`);
            nodeDeleteInput.addFields({
                [relationship.name]: relationship.isList ? deleteFieldInput.NonNull.List : deleteFieldInput,
            });
            updateFieldInput.addFields({
                delete: relationship.isList ? deleteFieldInput.NonNull.List : deleteFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)) {
            const nodeDisconnectInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}DisconnectInput`);
            nodeDisconnectInput.addFields({
                [relationship.name]: relationship.isList ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
            });
            updateFieldInput.addFields({
                disconnect: relationship.isList ? disconnectFieldInput.NonNull.List : disconnectFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
            const nodeRelationInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}RelationInput`);
            nodeRelationInput.addFields({
                [relationship.name]: relationship.isList ? createFieldInput.NonNull.List : createFieldInput,
            });
            updateFieldInput.addFields({
                create: relationship.isList ? createFieldInput.NonNull.List : createFieldInput,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
            updateFieldInput.addFields({
                update: updateConnectionFieldInput,
            });
        }

        updateFieldInput.addFields({
            where: relationship.connectionWhereTypename,
        });

        if (relationship.isUpdatable()) {
            sourceUpdateInput.addFields({
                [relationship.name]: relationship.isList ? updateFieldInput.NonNull.List : updateFieldInput,
            });
        }
    }

    if (relationship.isReadable()) {
        const baseNodeFieldArgs = {
            options: `${relationship.target.name}Options`,
            where: `${relationship.target.name}Where`,
        };
        const nodeFieldArgs = addDirectedArgument2(baseNodeFieldArgs, relationship);

        composeNode.addFields({
            [relationship.name]: {
                type: relationship.getTargetTypePrettyName(),
                args: nodeFieldArgs,
                description: relationship.description,
                directives: graphqlDirectivesToCompose(userDefinedFieldDirectives.get(relationship.name) ?? []),
            },
        });
    }

    if (
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
        nestedOperations.has(RelationshipNestedOperationsOption.CREATE)
    ) {
        const nodeFieldInput = schemaComposer.getOrCreateITC(relationship.fieldInputTypeName, (tc) => {
            if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
                tc.addFields({
                    create: relationship.isList ? createFieldInput.NonNull.List : createFieldInput,
                });
            }
            if (nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)) {
                tc.addFields({
                    connect: relationship.isList ? connectFieldInput.NonNull.List : connectFieldInput,
                });
            }
        });

        refNodes.forEach((n) => {
            if (!schemaComposer.has(relationship.createFieldInputTypeName)) {
                schemaComposer.getOrCreateITC(relationship.createFieldInputTypeName, (tc) => {
                    tc.addFields({ node: `${n.name}CreateInput!` });

                    if (hasNonGeneratedProperties) {
                        tc.addFields({
                            edge: relationship.edgeCreateInputTypeName,
                        });
                    }
                });
            }
        });
        // Interface CreateInput does not require relationship input fields
        // These are specified on the concrete nodes.
        if (relationship.isCreatable() && !(composeNode instanceof InterfaceTypeComposer)) {
            sourceCreateInput.addFields({
                [relationship.name]: nodeFieldInput,
            });
        }
    }
}
