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
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationField } from "../../types";
import { addDirectedArgument } from "../directed-argument";
import { augmentObjectOrInterfaceTypeWithRelationshipField } from "../generation/augment-object-or-interface";
import { augmentConnectInputTypeWithConnectFieldInput } from "../generation/connect-input";
import {
    augmentCreateInputTypeWithRelationshipsInput,
    withFieldInputType,
    withRelationInputType,
} from "../generation/create-input";
import { augmentDeleteInputTypeWithDeleteFieldInput } from "../generation/delete-input";
import { augmentDisconnectInputTypeWithDisconnectFieldInput } from "../generation/disconnect-input";
import { augmentUpdateInputTypeWithUpdateFieldInput } from "../generation/update-input";
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
    userDefinedFieldDirectives,
}: {
    relationship: RelationshipAdapter;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}) {
    // ======== all relationships but DEPENDENCY ALERT:
    // this has to happen for InterfaceRelationships (Interfaces that are target of relationships) before it happens for ConcreteEntity targets
    // it has sth to do with fieldInputPrefixForTypename vs prefixForTypename
    // requires investigation
    withFieldInputType(relationship, schemaComposer, userDefinedFieldDirectives);

    // ======== all relationships:
    composeNode.addFields(augmentObjectOrInterfaceTypeWithRelationshipField(relationship, userDefinedFieldDirectives));

    withRelationInputType(relationship, schemaComposer, [], userDefinedFieldDirectives);

    augmentCreateInputTypeWithRelationshipsInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
        userDefinedFieldDirectives,
    });

    augmentConnectInputTypeWithConnectFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
    });

    augmentDeleteInputTypeWithDeleteFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
    });

    augmentDisconnectInputTypeWithDisconnectFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
    });

    augmentUpdateInputTypeWithUpdateFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
        userDefinedFieldDirectives,
    });
}
