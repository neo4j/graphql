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
import type { InputTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceTypeComposer, upperFirst } from "graphql-compose";
import type { Node } from "../../classes";
import { RelationshipNestedOperationsOption } from "../../constants";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationField } from "../../types";
import { DEPRECATE_NOT } from "../constants";
import { addDirectedArgument, addDirectedArgument2 } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";
import { createConnectOrCreateField, createConnectOrCreateField2 } from "./create-connect-or-create-field";

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
    const nestedOperations = new Set(rel.nestedOperations);
    const nodeCreateInput = schemaComposer.getITC(`${sourceName}CreateInput`);
    const refNodes = nodes.filter((x) => rel.union?.nodes?.includes(x.name));
    const onlyConnectOrCreateAndNoUniqueFieldsInAllRefTypes =
        nestedOperations.size === 1 &&
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
        !refNodes.find((n) => n.uniqueFields.length);

    if (!rel.writeonly) {
        const baseNodeFieldArgs = {
            options: "QueryOptions",
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

    const upperFieldName = upperFirst(rel.fieldName);
    const upperNodeName = upperFirst(sourceName);
    const typePrefix = `${upperNodeName}${upperFieldName}`;

    const unionConnectInput = nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)
        ? schemaComposer.createInputTC({
              name: `${typePrefix}ConnectInput`,
              fields: {},
          })
        : undefined;
    const unionDeleteInput = nestedOperations.has(RelationshipNestedOperationsOption.DELETE)
        ? schemaComposer.createInputTC({
              name: `${typePrefix}DeleteInput`,
              fields: {},
          })
        : undefined;
    const unionDisconnectInput = nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)
        ? schemaComposer.createInputTC({
              name: `${typePrefix}DisconnectInput`,
              fields: {},
          })
        : undefined;
    let unionCreateInput: InputTypeComposer<any> | undefined;

    const connectOrCreateAndUniqueFieldsInRefTypes =
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
        refNodes.find((n) => n.uniqueFields.length);

    if (
        nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
        connectOrCreateAndUniqueFieldsInRefTypes
    ) {
        unionCreateInput = schemaComposer.createInputTC({
            name: `${typePrefix}CreateInput`,
            fields: {},
        });
    }

    const unionUpdateInput = schemaComposer.createInputTC({
        name: `${typePrefix}UpdateInput`,
        fields: {},
    });

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

        const connectAndCreateAndUniqueFields =
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) && n.uniqueFields.length;
        const onlyConnectOrCreateAndNoUniqueFields =
            nestedOperations.size === 1 &&
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
            !n.uniqueFields.length;

        let updateFields: Record<string, string> | undefined;
        if (nestedOperations.size !== 0 && !onlyConnectOrCreateAndNoUniqueFields) {
            updateFields = {
                where: whereName,
            };
        }

        let fieldInputFields: Record<string, string> | undefined;
        if (
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
            nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
            connectAndCreateAndUniqueFields
        ) {
            // Created as {} because the connect/create fields are added later
            fieldInputFields = {};
        }

        const createName = `${sourceName}${upperFirst(rel.fieldName)}${n.name}CreateFieldInput`;
        if (!schemaComposer.has(createName)) {
            schemaComposer.getOrCreateITC(createName, (tc) => {
                tc.addFields({ node: `${n.name}CreateInput!` });

                if (hasNonGeneratedProperties) {
                    tc.addFields({
                        edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
                    });
                }
            });

            if (
                unionCreateInput &&
                (nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
                    nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
                    connectAndCreateAndUniqueFields)
            ) {
                unionCreateInput.addFields({
                    [n.name]: nodeFieldInputName,
                });
            }

            unionCreateFieldInput.addFields({
                [n.name]: rel.typeMeta.array ? `[${createName}!]` : createName,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE) && (updateFields || fieldInputFields)) {
            const create = rel.typeMeta.array ? `[${createName}!]` : createName;
            if (updateFields) {
                updateFields.create = create;
            }
            if (fieldInputFields) {
                fieldInputFields.create = create;
            }
        }

        if (unionConnectInput && (updateFields || fieldInputFields)) {
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
                schemaComposer.getOrCreateITC(connectName, (tc) => {
                    tc.addFields({ where: connectWhereName });

                    if (n.relationFields.length) {
                        tc.addFields({
                            connect: rel.typeMeta.array ? `[${n.name}ConnectInput!]` : `${n.name}ConnectInput`,
                        });
                    }

                    if (hasNonGeneratedProperties) {
                        tc.addFields({
                            edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
                        });
                    }
                });

                unionConnectInput.addFields({
                    [n.name]: connect,
                });

                if (updateFields) {
                    updateFields.connect = connect;
                }
                if (fieldInputFields) {
                    fieldInputFields.connect = connect;
                }
            }
        }

        if (
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
            (updateFields || fieldInputFields)
        ) {
            const connectOrCreate = createConnectOrCreateField({
                relationField: rel,
                node: n,
                schemaComposer,
                hasNonGeneratedProperties,
                hasNonNullNonGeneratedProperties,
            });

            if (connectOrCreate) {
                if (updateFields) {
                    updateFields.connectOrCreate = connectOrCreate;
                }
                if (fieldInputFields) {
                    fieldInputFields.connectOrCreate = connectOrCreate;
                }
            }
        }

        if (unionDeleteInput && updateFields) {
            if (!schemaComposer.has(deleteName)) {
                schemaComposer.getOrCreateITC(deleteName, (tc) => {
                    tc.addFields({ where: whereName });

                    if (n.relationFields.length) {
                        tc.addFields({
                            delete: `${n.name}DeleteInput`,
                        });
                    }
                });

                unionDeleteInput.addFields({
                    [n.name]: deleteField,
                });
            }

            updateFields.delete = rel.typeMeta.array ? `[${deleteName}!]` : deleteName;
        }

        if (unionDisconnectInput && updateFields) {
            if (!schemaComposer.has(disconnectName)) {
                schemaComposer.getOrCreateITC(disconnectName, (tc) => {
                    tc.addFields({ where: whereName });

                    if (n.relationFields.length) {
                        tc.addFields({
                            disconnect: `${n.name}DisconnectInput`,
                        });
                    }
                });

                unionDisconnectInput.addFields({
                    [n.name]: disconnect,
                });

                updateFields.disconnect = rel.typeMeta.array ? `[${disconnectName}!]` : disconnectName;
            }
        }

        if (updateFields) {
            const updateName = `${unionPrefix}UpdateFieldInput`;
            const update = rel.typeMeta.array ? `[${updateName}!]` : updateName;
            if (nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
                updateFields.update = connectionUpdateInputName;
            }
            if (!schemaComposer.has(updateName)) {
                schemaComposer.createInputTC({
                    name: updateName,
                    fields: updateFields,
                });

                unionUpdateInput.addFields({
                    [n.name]: update,
                });
            }

            schemaComposer.getOrCreateITC(connectionUpdateInputName, (tc) => {
                tc.addFields({ node: updateField });

                if (hasNonGeneratedProperties) {
                    tc.addFields({
                        edge: `${rel.properties}UpdateInput`,
                    });
                }
            });
        }

        if (fieldInputFields) {
            schemaComposer.createInputTC({
                name: nodeFieldInputName,
                fields: fieldInputFields,
            });
        }

        schemaComposer.getOrCreateITC(whereName, (tc) => {
            tc.addFields({
                node: `${n.name}Where`,
                node_NOT: {
                    type: `${n.name}Where`,
                    directives: [DEPRECATE_NOT],
                },
                AND: `[${whereName}!]`,
                OR: `[${whereName}!]`,
                NOT: whereName,
            });

            if (rel.properties) {
                tc.addFields({
                    edge: `${rel.properties}Where`,
                    edge_NOT: {
                        type: `${rel.properties}Where`,
                        directives: [DEPRECATE_NOT],
                    },
                });
            }
        });

        if (connectAndCreateAndUniqueFields) {
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

    if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        const nodeRelationInput = schemaComposer.getOrCreateITC(`${sourceName}RelationInput`);
        nodeRelationInput.addFields({
            [rel.fieldName]: unionCreateFieldInput,
        });
    }
    if (rel.settableOptions.onCreate && !(composeNode instanceof InterfaceTypeComposer) && unionCreateInput) {
        nodeCreateInput.addFields({
            [rel.fieldName]: unionCreateInput,
        });
    }
    if (
        rel.settableOptions.onUpdate &&
        nestedOperations.size !== 0 &&
        !onlyConnectOrCreateAndNoUniqueFieldsInAllRefTypes
    ) {
        const nodeUpdateInput = schemaComposer.getITC(`${sourceName}UpdateInput`);
        nodeUpdateInput.addFields({
            [rel.fieldName]: unionUpdateInput,
        });
    }
    if (unionConnectInput) {
        const nodeConnectInput = schemaComposer.getOrCreateITC(`${sourceName}ConnectInput`);
        nodeConnectInput.addFields({
            [rel.fieldName]: unionConnectInput,
        });
    }
    if (unionDeleteInput) {
        const nodeDeleteInput = schemaComposer.getOrCreateITC(`${sourceName}DeleteInput`);
        nodeDeleteInput.addFields({
            [rel.fieldName]: unionDeleteInput,
        });
    }
    if (unionDisconnectInput) {
        const nodeDisconnectInput = schemaComposer.getOrCreateITC(`${sourceName}DisconnectInput`);
        nodeDisconnectInput.addFields({
            [rel.fieldName]: unionDisconnectInput,
        });
    }
}

export function createRelationshipUnionFields2({
    relationship,
    composeNode,
    schemaComposer,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
    userDefinedFieldDirectives,
}: {
    relationship: RelationshipAdapter;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}) {
    const refNodes = (relationship.target as UnionEntityAdapter).concreteEntities;

    const sourceAdapter = relationship.source as ConcreteEntityAdapter | InterfaceEntityAdapter;
    const nestedOperations = new Set(relationship.nestedOperations);
    const nodeCreateInput = schemaComposer.getITC(`${sourceAdapter.name}CreateInput`);
    // const refNodes = nodes.filter((x) => rel.union?.nodes?.includes(x.name));fNodes.find((n) => n.uniqueFields.length);

    const onlyConnectOrCreateAndNoUniqueFieldsInAllRefTypes =
        nestedOperations.size === 1 &&
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
        !refNodes.find((n) => n.uniqueFields.length);

    if (relationship.isReadable()) {
        const baseNodeFieldArgs = {
            options: "QueryOptions",
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

    const upperFieldName = upperFirst(relationship.name);
    const upperNodeName = upperFirst(sourceAdapter.name);
    const typePrefix = `${upperNodeName}${upperFieldName}`;

    const unionConnectInput = nestedOperations.has(RelationshipNestedOperationsOption.CONNECT)
        ? schemaComposer.createInputTC({
              name: `${typePrefix}ConnectInput`,
              fields: {},
          })
        : undefined;
    const unionDeleteInput = nestedOperations.has(RelationshipNestedOperationsOption.DELETE)
        ? schemaComposer.createInputTC({
              name: `${typePrefix}DeleteInput`,
              fields: {},
          })
        : undefined;
    const unionDisconnectInput = nestedOperations.has(RelationshipNestedOperationsOption.DISCONNECT)
        ? schemaComposer.createInputTC({
              name: `${typePrefix}DisconnectInput`,
              fields: {},
          })
        : undefined;
    let unionCreateInput: InputTypeComposer<any> | undefined;

    const connectOrCreateAndUniqueFieldsInRefTypes =
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
        refNodes.find((n) => n.uniqueFields.length);

    if (
        nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
        nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
        connectOrCreateAndUniqueFieldsInRefTypes
    ) {
        unionCreateInput = schemaComposer.createInputTC({
            name: `${typePrefix}CreateInput`,
            fields: {},
        });
    }

    const unionUpdateInput = schemaComposer.createInputTC({
        name: `${typePrefix}UpdateInput`,
        fields: {},
    });

    const unionCreateFieldInput = schemaComposer.createInputTC({
        name: `${typePrefix}CreateFieldInput`,
        fields: {},
    });

    refNodes.forEach((unionMemberEntity) => {
        const unionPrefix = `${sourceAdapter.name}${upperFieldName}${unionMemberEntity.name}`;
        const updateField = `${unionMemberEntity.name}UpdateInput`;
        const nodeFieldInputName = `${unionPrefix}FieldInput`;
        const whereName = `${unionPrefix}ConnectionWhere`;

        const deleteName = `${unionPrefix}DeleteFieldInput`;
        const deleteField = relationship.isList ? `[${deleteName}!]` : `${deleteName}`;

        const disconnectName = `${unionPrefix}DisconnectFieldInput`;
        const disconnect = relationship.isList ? `[${disconnectName}!]` : `${disconnectName}`;

        const connectionUpdateInputName = `${unionPrefix}UpdateConnectionInput`;

        const connectAndCreateAndUniqueFields =
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
            unionMemberEntity.uniqueFields.length;
        const onlyConnectOrCreateAndNoUniqueFields =
            nestedOperations.size === 1 &&
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
            !unionMemberEntity.uniqueFields.length;

        let updateFields: Record<string, string> | undefined;
        if (nestedOperations.size !== 0 && !onlyConnectOrCreateAndNoUniqueFields) {
            updateFields = {
                where: whereName,
            };
        }

        let fieldInputFields: Record<string, string> | undefined;
        if (
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
            nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
            connectAndCreateAndUniqueFields
        ) {
            // Created as {} because the connect/create fields are added later
            fieldInputFields = {};
        }

        const createName = `${sourceAdapter.name}${upperFirst(relationship.name)}${
            unionMemberEntity.name
        }CreateFieldInput`;
        if (!schemaComposer.has(createName)) {
            schemaComposer.getOrCreateITC(createName, (tc) => {
                tc.addFields({ node: `${unionMemberEntity.name}CreateInput!` });

                if (hasNonGeneratedProperties) {
                    tc.addFields({
                        edge: `${relationship.propertiesTypeName}CreateInput${
                            hasNonNullNonGeneratedProperties ? `!` : ""
                        }`,
                    });
                }
            });

            if (
                unionCreateInput &&
                (nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
                    nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
                    connectAndCreateAndUniqueFields)
            ) {
                unionCreateInput.addFields({
                    [unionMemberEntity.name]: nodeFieldInputName,
                });
            }

            unionCreateFieldInput.addFields({
                [unionMemberEntity.name]: relationship.isList ? `[${createName}!]` : createName,
            });
        }
        if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE) && (updateFields || fieldInputFields)) {
            const create = relationship.isList ? `[${createName}!]` : createName;
            if (updateFields) {
                updateFields.create = create;
            }
            if (fieldInputFields) {
                fieldInputFields.create = create;
            }
        }

        if (unionConnectInput && (updateFields || fieldInputFields)) {
            const connectWhereName = `${unionMemberEntity.name}ConnectWhere`;
            if (!schemaComposer.has(connectWhereName)) {
                schemaComposer.createInputTC({
                    name: connectWhereName,
                    fields: {
                        node: `${unionMemberEntity.name}Where!`,
                    },
                });
            }

            const connectName = `${unionPrefix}ConnectFieldInput`;
            const connect = relationship.isList ? `[${connectName}!]` : `${connectName}`;
            if (!schemaComposer.has(connectName)) {
                schemaComposer.getOrCreateITC(connectName, (tc) => {
                    tc.addFields({ where: connectWhereName });

                    if (unionMemberEntity.relationships.size) {
                        tc.addFields({
                            connect: relationship.isList
                                ? `[${unionMemberEntity.name}ConnectInput!]`
                                : `${unionMemberEntity.name}ConnectInput`,
                        });
                    }

                    if (hasNonGeneratedProperties) {
                        tc.addFields({
                            edge: `${relationship.propertiesTypeName}CreateInput${
                                hasNonNullNonGeneratedProperties ? `!` : ""
                            }`,
                        });
                    }
                });

                unionConnectInput.addFields({
                    [unionMemberEntity.name]: connect,
                });

                if (updateFields) {
                    updateFields.connect = connect;
                }
                if (fieldInputFields) {
                    fieldInputFields.connect = connect;
                }
            }
        }

        if (
            nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
            (updateFields || fieldInputFields)
        ) {
            const connectOrCreate = createConnectOrCreateField2({
                relationshipAdapter: relationship,
                targetEntityAdapter: unionMemberEntity,
                schemaComposer,
                userDefinedFieldDirectives,
            });

            if (connectOrCreate) {
                if (updateFields) {
                    updateFields.connectOrCreate = connectOrCreate;
                }
                if (fieldInputFields) {
                    fieldInputFields.connectOrCreate = connectOrCreate;
                }
            }
        }

        if (unionDeleteInput && updateFields) {
            if (!schemaComposer.has(deleteName)) {
                schemaComposer.getOrCreateITC(deleteName, (tc) => {
                    tc.addFields({ where: whereName });

                    if (unionMemberEntity.relationships.size) {
                        tc.addFields({
                            delete: `${unionMemberEntity.name}DeleteInput`,
                        });
                    }
                });

                unionDeleteInput.addFields({
                    [unionMemberEntity.name]: deleteField,
                });
            }

            updateFields.delete = relationship.isList ? `[${deleteName}!]` : deleteName;
        }

        if (unionDisconnectInput && updateFields) {
            if (!schemaComposer.has(disconnectName)) {
                schemaComposer.getOrCreateITC(disconnectName, (tc) => {
                    tc.addFields({ where: whereName });

                    if (unionMemberEntity.relationships.size) {
                        tc.addFields({
                            disconnect: `${unionMemberEntity.name}DisconnectInput`,
                        });
                    }
                });

                unionDisconnectInput.addFields({
                    [unionMemberEntity.name]: disconnect,
                });

                updateFields.disconnect = relationship.isList ? `[${disconnectName}!]` : disconnectName;
            }
        }

        if (updateFields) {
            const updateName = `${unionPrefix}UpdateFieldInput`;
            const update = relationship.isList ? `[${updateName}!]` : updateName;
            if (nestedOperations.has(RelationshipNestedOperationsOption.UPDATE)) {
                updateFields.update = connectionUpdateInputName;
            }
            if (!schemaComposer.has(updateName)) {
                schemaComposer.createInputTC({
                    name: updateName,
                    fields: updateFields,
                });

                unionUpdateInput.addFields({
                    [unionMemberEntity.name]: update,
                });
            }

            schemaComposer.getOrCreateITC(connectionUpdateInputName, (tc) => {
                tc.addFields({ node: updateField });

                if (hasNonGeneratedProperties) {
                    tc.addFields({
                        edge: `${relationship.propertiesTypeName}UpdateInput`,
                    });
                }
            });
        }

        if (fieldInputFields) {
            schemaComposer.createInputTC({
                name: nodeFieldInputName,
                fields: fieldInputFields,
            });
        }

        schemaComposer.getOrCreateITC(whereName, (tc) => {
            tc.addFields({
                node: `${unionMemberEntity.name}Where`,
                node_NOT: {
                    type: `${unionMemberEntity.name}Where`,
                    directives: [DEPRECATE_NOT],
                },
                AND: `[${whereName}!]`,
                OR: `[${whereName}!]`,
                NOT: whereName,
            });

            if (relationship.propertiesTypeName) {
                tc.addFields({
                    edge: `${relationship.propertiesTypeName}Where`,
                    edge_NOT: {
                        type: `${relationship.propertiesTypeName}Where`,
                        directives: [DEPRECATE_NOT],
                    },
                });
            }
        });

        if (connectAndCreateAndUniqueFields) {
            // TODO: merge with createTopLevelConnectOrCreateInput
            const nodeConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
                `${sourceAdapter.name}ConnectOrCreateInput`
            );

            const nodeRelationConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
                `${sourceAdapter.name}${upperFirst(relationship.name)}ConnectOrCreateInput`
            );

            nodeConnectOrCreateInput.addFields({
                [relationship.name]: nodeRelationConnectOrCreateInput,
            });

            const nodeFieldConnectOrCreateInputName = `${sourceAdapter.name}${upperFirst(relationship.name)}${
                unionMemberEntity.name
            }ConnectOrCreateFieldInput`;

            nodeRelationConnectOrCreateInput.addFields({
                [unionMemberEntity.name]: relationship.isList
                    ? `[${nodeFieldConnectOrCreateInputName}!]`
                    : nodeFieldConnectOrCreateInputName,
            });
        }
    });

    if (nestedOperations.has(RelationshipNestedOperationsOption.CREATE)) {
        const nodeRelationInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}RelationInput`);
        nodeRelationInput.addFields({
            [relationship.name]: unionCreateFieldInput,
        });
    }
    if (relationship.isCreatable() && !(composeNode instanceof InterfaceTypeComposer) && unionCreateInput) {
        nodeCreateInput.addFields({
            [relationship.name]: unionCreateInput,
        });
    }
    if (
        relationship.isUpdatable() &&
        nestedOperations.size !== 0 &&
        !onlyConnectOrCreateAndNoUniqueFieldsInAllRefTypes
    ) {
        const nodeUpdateInput = schemaComposer.getITC(`${sourceAdapter.name}UpdateInput`);
        nodeUpdateInput.addFields({
            [relationship.name]: unionUpdateInput,
        });
    }
    if (unionConnectInput) {
        const nodeConnectInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}ConnectInput`);
        nodeConnectInput.addFields({
            [relationship.name]: unionConnectInput,
        });
    }
    if (unionDeleteInput) {
        const nodeDeleteInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}DeleteInput`);
        nodeDeleteInput.addFields({
            [relationship.name]: unionDeleteInput,
        });
    }
    if (unionDisconnectInput) {
        const nodeDisconnectInput = schemaComposer.getOrCreateITC(`${sourceAdapter.name}DisconnectInput`);
        nodeDisconnectInput.addFields({
            [relationship.name]: unionDisconnectInput,
        });
    }
}
