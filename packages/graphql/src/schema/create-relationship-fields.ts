import {
    InputTypeComposer,
    InterfaceTypeComposer,
    ObjectTypeComposer,
    SchemaComposer,
    upperFirst,
} from "graphql-compose";
import { Node } from "../classes";
import { RelationField } from "../types";
import { ObjectFields } from "./get-obj-field-meta";

function createRelationshipFields({
    relationshipFields,
    schemaComposer,
    // TODO: Ideally we come up with a solution where we don't have to pass the following into these kind of functions
    composeNode,
    sourceName,
    nodes,
    relationshipPropertyFields,
}: {
    relationshipFields: RelationField[];
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    sourceName: string;
    nodes: Node[];
    relationshipPropertyFields: Map<string, ObjectFields>;
}) {
    const whereInput = schemaComposer.getITC(`${sourceName}Where`);
    const nodeCreateInput = schemaComposer.getITC(`${sourceName}CreateInput`);
    const nodeUpdateInput = schemaComposer.getITC(`${sourceName}UpdateInput`);

    let nodeConnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
    let nodeDeleteInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
    let nodeDisconnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
    let nodeRelationInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
    if (relationshipFields.length) {
        [nodeConnectInput, nodeDeleteInput, nodeDisconnectInput, nodeRelationInput] = [
            "ConnectInput",
            "DeleteInput",
            "DisconnectInput",
            "RelationInput",
        ].map((type) => schemaComposer.getOrCreateITC(`${sourceName}${type}`));
    }

    relationshipFields.forEach((rel) => {
        if (rel.interface) {
            const refNodes = nodes.filter((x) => rel.interface?.implementations?.includes(x.name));

            let anyNonNullRelProperties = false;

            if (rel.properties) {
                const relFields = relationshipPropertyFields.get(rel.properties);

                if (relFields) {
                    anyNonNullRelProperties = [
                        ...relFields.primitiveFields,
                        ...relFields.scalarFields,
                        ...relFields.enumFields,
                        ...relFields.temporalFields,
                        ...relFields.pointFields,
                    ].some((field) => field.typeMeta.required);
                }
            }

            composeNode.addFields({
                [rel.fieldName]: {
                    type: rel.typeMeta.pretty,
                    args: {
                        // options: queryOptions.getTypeName(),
                        where: `${rel.typeMeta.name}Where`,
                    },
                },
            });

            const upperFieldName = upperFirst(rel.fieldName);
            const upperNodeName = upperFirst(sourceName);
            const typePrefix = `${upperNodeName}${upperFieldName}`;

            const connectWhere = schemaComposer.getOrCreateITC(`${rel.typeMeta.name}ConnectWhere`, (tc) => {
                tc.addFields({
                    node: `${rel.typeMeta.name}Where!`,
                });
            });

            const connectFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}ConnectFieldInput`,
                (tc) => {
                    tc.addFields({
                        ...(schemaComposer.has(`${rel.typeMeta.name}ConnectInput`)
                            ? { connect: `${rel.typeMeta.name}ConnectInput` }
                            : {}),
                        ...(rel.properties
                            ? { edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
                            : {}),
                        where: connectWhere,
                        // ...(n.relationFields.length
                        //     ? { connect: rel.typeMeta.array ? `[${n.name}ConnectInput!]` : `${n.name}ConnectInput` }
                        //     : {}),
                    });
                }
            );

            const deleteFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}DeleteFieldInput`,
                (tc) => {
                    tc.addFields({
                        ...(schemaComposer.has(`${rel.typeMeta.name}DeleteInput`)
                            ? { delete: `${rel.typeMeta.name}DeleteInput` }
                            : {}),
                        where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    });
                }
            );

            const disconnectFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}DisconnectFieldInput`,
                (tc) => {
                    tc.addFields({
                        ...(schemaComposer.has(`${rel.typeMeta.name}DisconnectInput`)
                            ? { disconnect: `${rel.typeMeta.name}DisconnectInput` }
                            : {}),
                        where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    });
                }
            );

            const createFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}CreateFieldInput`,
                (tc) => {
                    tc.addFields({
                        edge: `${rel.properties}CreateInput!`,
                        node: `${rel.typeMeta.name}CreateInput!`,
                    });
                }
            );

            const updateConnectionInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}UpdateConnectionInput`,
                (tc) => {
                    tc.addFields({
                        ...(rel.properties ? { edge: `${rel.properties}UpdateInput` } : {}),
                        node: `${rel.typeMeta.name}UpdateInput`,
                    });
                }
            );

            const updateFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}UpdateFieldInput`,
                (tc) => {
                    tc.addFields({
                        connect: `${sourceName}${upperFirst(rel.fieldName)}ConnectFieldInput`,
                        create: `${sourceName}${upperFirst(rel.fieldName)}CreateFieldInput`,
                        delete: `${sourceName}${upperFirst(rel.fieldName)}DeleteFieldInput`,
                        disconnect: `${sourceName}${upperFirst(rel.fieldName)}DisconnectFieldInput`,
                        update: `${sourceName}${upperFirst(rel.fieldName)}UpdateConnectionInput`,
                        where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    });
                }
            );

            refNodes.forEach((n) => {
                const unionPrefix = `${sourceName}${upperFieldName}${n.name}`;
                const updateField = `${n.name}UpdateInput`;
                const nodeFieldInputName = `${unionPrefix}FieldInput`;
                const whereName = `${unionPrefix}ConnectionWhere`;

                const deleteName = `${unionPrefix}DeleteFieldInput`;
                const _delete = rel.typeMeta.array ? `[${deleteName}!]` : `${deleteName}`;

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
                            ...(rel.properties ? { edge: `${rel.properties}CreateInput!` } : {}),
                        },
                    });

                    // interfaceCreateInput.addFields({
                    //     [n.name]: `[${createName}!]`,
                    // });

                    // createFieldInput.addFields({
                    //     [n.name]: create,
                    // });
                }

                if (n.relationFields.length) {
                }
            });

            nodeCreateInput.addFields({
                [rel.fieldName]: createFieldInput,
            });

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
                [rel.fieldName]: createFieldInput,
            });

            nodeUpdateInput.addFields({
                [rel.fieldName]: updateFieldInput,
            });

            return;
        }

        if (rel.union) {
            const refNodes = nodes.filter((x) => rel.union?.nodes?.includes(x.name));

            composeNode.addFields({
                [rel.fieldName]: {
                    type: rel.typeMeta.pretty,
                    args: {
                        options: "QueryOptions",
                        where: `${rel.typeMeta.name}Where`,
                    },
                },
            });

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
            );

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
                const _delete = rel.typeMeta.array ? `[${deleteName}!]` : `${deleteName}`;

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
                            ...(rel.properties ? { edge: `${rel.properties}CreateInput!` } : {}),
                        },
                    });

                    unionCreateInput.addFields({
                        [n.name]: nodeFieldInputName,
                    });

                    unionCreateFieldInput.addFields({
                        [n.name]: `[${createName}!]`,
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
                                      connect: rel.typeMeta.array
                                          ? `[${n.name}ConnectInput!]`
                                          : `${n.name}ConnectInput`,
                                  }
                                : {}),
                            ...(rel.properties ? { edge: `${rel.properties}CreateInput!` } : {}),
                        },
                    });

                    unionConnectInput.addFields({
                        [n.name]: connect,
                    });
                }

                const updateName = `${unionPrefix}UpdateFieldInput`;
                const update = rel.typeMeta.array ? `[${updateName}!]` : updateName;
                if (!schemaComposer.has(updateName)) {
                    schemaComposer.createInputTC({
                        name: updateName,
                        fields: {
                            where: whereName,
                            update: connectionUpdateInputName,
                            connect,
                            disconnect: rel.typeMeta.array ? `[${disconnectName}!]` : disconnectName,
                            create,
                            delete: rel.typeMeta.array ? `[${deleteName}!]` : deleteName,
                        },
                    });

                    unionUpdateInput.addFields({
                        [n.name]: update,
                    });
                }

                schemaComposer.createInputTC({
                    name: connectionUpdateInputName,
                    fields: {
                        ...(rel.properties ? { edge: `${rel.properties}UpdateInput` } : {}),
                        node: updateField,
                    },
                });

                schemaComposer.createInputTC({
                    name: nodeFieldInputName,
                    fields: {
                        create,
                        connect,
                    },
                });

                schemaComposer.createInputTC({
                    name: whereName,
                    fields: {
                        node: `${n.name}Where`,
                        node_NOT: `${n.name}Where`,
                        AND: `[${whereName}!]`,
                        OR: `[${whereName}!]`,
                        ...(rel.properties
                            ? {
                                  edge: `${rel.properties}Where`,
                                  edge_NOT: `${rel.properties}Where`,
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
                        [n.name]: _delete,
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
            });

            nodeCreateInput.addFields({
                [rel.fieldName]: unionCreateInput,
            });

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

            return;
        }

        const n = nodes.find((x) => x.name === rel.typeMeta.name) as Node;
        const updateField = `${n.name}UpdateInput`;

        const nodeFieldInputName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}FieldInput`;
        const nodeFieldUpdateInputName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}UpdateFieldInput`;
        const nodeFieldDeleteInputName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}DeleteFieldInput`;
        const nodeFieldDisconnectInputName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}DisconnectFieldInput`;

        const connectionUpdateInputName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}UpdateConnectionInput`;

        whereInput.addFields({
            ...{ [rel.fieldName]: `${n.name}Where`, [`${rel.fieldName}_NOT`]: `${n.name}Where` },
        });

        let anyNonNullRelProperties = false;

        if (rel.properties) {
            const relFields = relationshipPropertyFields.get(rel.properties);

            if (relFields) {
                anyNonNullRelProperties = [
                    ...relFields.primitiveFields,
                    ...relFields.scalarFields,
                    ...relFields.enumFields,
                    ...relFields.temporalFields,
                    ...relFields.pointFields,
                ].some((field) => field.typeMeta.required);
            }
        }

        const createName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}CreateFieldInput`;
        const create = rel.typeMeta.array ? `[${createName}!]` : createName;
        schemaComposer.getOrCreateITC(createName, (tc) => {
            tc.addFields({
                node: `${n.name}CreateInput!`,
                ...(rel.properties
                    ? { edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
                    : {}),
            });
        });

        const connectWhereName = `${n.name}ConnectWhere`;
        schemaComposer.getOrCreateITC(connectWhereName, (tc) => {
            tc.addFields({
                node: `${n.name}Where!`,
            });
        });

        const connectName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectFieldInput`;
        const connect = rel.typeMeta.array ? `[${connectName}!]` : connectName;
        schemaComposer.getOrCreateITC(connectName, (tc) => {
            tc.addFields({
                where: connectWhereName,
                ...(n.relationFields.length
                    ? { connect: rel.typeMeta.array ? `[${n.name}ConnectInput!]` : `${n.name}ConnectInput` }
                    : {}),
                ...(rel.properties
                    ? { edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
                    : {}),
            });
        });

        composeNode.addFields({
            [rel.fieldName]: {
                type: rel.typeMeta.pretty,
                args: {
                    where: `${rel.typeMeta.name}Where`,
                    options: `${rel.typeMeta.name}Options`,
                },
            },
        });

        schemaComposer.getOrCreateITC(connectionUpdateInputName, (tc) => {
            tc.addFields({
                node: updateField,
                ...(rel.properties ? { edge: `${rel.properties}UpdateInput` } : {}),
            });
        });

        schemaComposer.getOrCreateITC(nodeFieldUpdateInputName, (tc) => {
            tc.addFields({
                where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                update: connectionUpdateInputName,
                connect,
                disconnect: rel.typeMeta.array ? `[${nodeFieldDisconnectInputName}!]` : nodeFieldDisconnectInputName,
                create,
                delete: rel.typeMeta.array ? `[${nodeFieldDeleteInputName}!]` : nodeFieldDeleteInputName,
            });
        });

        schemaComposer.getOrCreateITC(nodeFieldInputName, (tc) => {
            tc.addFields({
                create,
                connect,
            });
        });

        if (!schemaComposer.has(nodeFieldDeleteInputName)) {
            schemaComposer.createInputTC({
                name: nodeFieldDeleteInputName,
                fields: {
                    where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    ...(n.relationFields.length ? { delete: `${n.name}DeleteInput` } : {}),
                },
            });
        }

        if (!schemaComposer.has(nodeFieldDisconnectInputName)) {
            schemaComposer.createInputTC({
                name: nodeFieldDisconnectInputName,
                fields: {
                    where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    ...(n.relationFields.length ? { disconnect: `${n.name}DisconnectInput` } : {}),
                },
            });
        }

        nodeRelationInput.addFields({
            [rel.fieldName]: create,
        });

        if (!(composeNode instanceof InterfaceTypeComposer)) {
            nodeCreateInput.addFields({
                [rel.fieldName]: nodeFieldInputName,
            });
        }

        nodeUpdateInput.addFields({
            [rel.fieldName]: rel.typeMeta.array ? `[${nodeFieldUpdateInputName}!]` : nodeFieldUpdateInputName,
        });

        nodeDeleteInput.addFields({
            [rel.fieldName]: rel.typeMeta.array ? `[${nodeFieldDeleteInputName}!]` : nodeFieldDeleteInputName,
        });

        nodeConnectInput.addFields({
            [rel.fieldName]: connect,
        });

        nodeDisconnectInput.addFields({
            [rel.fieldName]: rel.typeMeta.array ? `[${nodeFieldDisconnectInputName}!]` : nodeFieldDisconnectInputName,
        });
    });
}

export default createRelationshipFields;
