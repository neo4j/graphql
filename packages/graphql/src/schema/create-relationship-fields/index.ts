import {
    InputTypeComposer,
    InterfaceTypeComposer,
    ObjectTypeComposer,
    SchemaComposer,
    upperFirst,
} from "graphql-compose";
import { Node } from "../../classes";
import { WHERE_AGGREGATION_AVERAGE_TYPES, WHERE_AGGREGATION_OPERATORS, WHERE_AGGREGATION_TYPES } from "../../constants";
import { BaseField, RelationField } from "../../types";
import { ObjectFields } from "../get-obj-field-meta";
import { createConnectOrCreateField } from "./create-connect-or-create-field";
import { FieldAggregationComposer } from "../aggregations/field-aggregation-composer";

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
        let hasNonGeneratedProperties = false;
        let hasNonNullNonGeneratedProperties = false;
        let anyNonNullRelProperties = false;
        let relFields: ObjectFields | undefined;

        if (rel.properties) {
            relFields = relationshipPropertyFields.get(rel.properties);

            if (relFields) {
                const nonGeneratedProperties = [
                    ...relFields.primitiveFields.filter((field) => !field.autogenerate),
                    ...relFields.scalarFields,
                    ...relFields.enumFields,
                    ...relFields.temporalFields.filter((field) => !field.timestamps),
                    ...relFields.pointFields,
                ];
                hasNonGeneratedProperties = nonGeneratedProperties.length > 0;
                hasNonNullNonGeneratedProperties = nonGeneratedProperties.some((field) => field.typeMeta.required);
                anyNonNullRelProperties = [
                    ...relFields.primitiveFields,
                    ...relFields.scalarFields,
                    ...relFields.enumFields,
                    ...relFields.temporalFields,
                    ...relFields.pointFields,
                ].some((field) => field.typeMeta.required);
            }
        }

        if (rel.interface) {
            const refNodes = nodes.filter((x) => rel.interface?.implementations?.includes(x.name));

            composeNode.addFields({
                [rel.fieldName]: {
                    type: rel.typeMeta.pretty,
                    args: {
                        options: "QueryOptions",
                        where: `${rel.typeMeta.name}Where`,
                    },
                },
            });

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
                        node: `${rel.typeMeta.name}CreateInput!`,
                    });
                    if (rel.properties) {
                        tc.addFields({
                            edge: `${rel.properties}CreateInput!`,
                        });
                    }
                }
            );

            schemaComposer.getOrCreateITC(`${sourceName}${upperFirst(rel.fieldName)}UpdateConnectionInput`, (tc) => {
                tc.addFields({
                    ...(rel.properties ? { edge: `${rel.properties}UpdateInput` } : {}),
                    node: `${rel.typeMeta.name}UpdateInput`,
                });
            });

            const updateFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}UpdateFieldInput`,
                (tc) => {
                    tc.addFields({
                        connect: rel.typeMeta.array
                            ? `[${sourceName}${upperFirst(rel.fieldName)}ConnectFieldInput!]`
                            : `${sourceName}${upperFirst(rel.fieldName)}ConnectFieldInput`,
                        create: rel.typeMeta.array
                            ? `[${sourceName}${upperFirst(rel.fieldName)}CreateFieldInput!]`
                            : `${sourceName}${upperFirst(rel.fieldName)}CreateFieldInput`,
                        delete: rel.typeMeta.array
                            ? `[${sourceName}${upperFirst(rel.fieldName)}DeleteFieldInput!]`
                            : `${sourceName}${upperFirst(rel.fieldName)}DeleteFieldInput`,
                        disconnect: rel.typeMeta.array
                            ? `[${sourceName}${upperFirst(rel.fieldName)}DisconnectFieldInput!]`
                            : `${sourceName}${upperFirst(rel.fieldName)}DisconnectFieldInput`,
                        update: `${sourceName}${upperFirst(rel.fieldName)}UpdateConnectionInput`,
                        where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    });
                }
            );

            const nodeFieldInput = schemaComposer.getOrCreateITC(
                `${rel.connectionPrefix}${upperFirst(rel.fieldName)}FieldInput`,
                (tc) => {
                    tc.addFields({
                        create: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
                        connect: rel.typeMeta.array ? connectFieldInput.NonNull.List : connectFieldInput,
                    });
                }
            );

            refNodes.forEach((n) => {
                const createName = `${sourceName}${upperFirst(rel.fieldName)}${n.name}CreateFieldInput`;
                if (!schemaComposer.has(createName)) {
                    schemaComposer.createInputTC({
                        name: createName,
                        fields: {
                            node: `${n.name}CreateInput!`,
                            ...(rel.properties ? { edge: `${rel.properties}CreateInput!` } : {}),
                        },
                    });
                }
            });

            nodeCreateInput.addFields({
                [rel.fieldName]: nodeFieldInput,
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
                [rel.fieldName]: rel.typeMeta.array ? createFieldInput.NonNull.List : createFieldInput,
            });

            nodeUpdateInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? updateFieldInput.NonNull.List : updateFieldInput,
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
                                      edge: `${rel.properties}CreateInput${
                                          hasNonNullNonGeneratedProperties ? `!` : ""
                                      }`,
                                  }
                                : {}),
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
                            ...(hasNonGeneratedProperties
                                ? {
                                      edge: `${rel.properties}CreateInput${
                                          hasNonNullNonGeneratedProperties ? `!` : ""
                                      }`,
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

                const fieldInputFields = {
                    create,
                    connect,
                } as Record<string, string>;

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
        const relationshipWhereTypeInputName = `${sourceName}${upperFirst(rel.fieldName)}AggregateInput`;

        const [nodeWhereAggregationInput, edgeWhereAggregationInput] = [n, relFields].map((nodeOrRelFields) => {
            if (!nodeOrRelFields) {
                return;
            }

            const fields = WHERE_AGGREGATION_TYPES.reduce<BaseField[]>((r, t) => {
                const f = [...nodeOrRelFields.primitiveFields, ...nodeOrRelFields.temporalFields].filter(
                    (y) => !y.typeMeta.array && y.typeMeta.name === t
                );

                if (!f.length) {
                    return r;
                }

                return r.concat(f);
            }, []);

            if (!fields.length) {
                return;
            }

            const name = `${sourceName}${upperFirst(rel.fieldName)}${
                nodeOrRelFields instanceof Node ? `Node` : `Edge`
            }AggregationWhereInput`;

            const aggregationInput = schemaComposer.createInputTC({
                name,
                fields: {
                    AND: `[${name}!]`,
                    OR: `[${name}!]`,
                },
            });

            fields.forEach((field) => {
                if (field.typeMeta.name === "ID") {
                    aggregationInput.addFields({
                        [`${field.fieldName}_EQUAL`]: "ID",
                    });

                    return;
                }

                if (field.typeMeta.name === "String") {
                    aggregationInput.addFields(
                        WHERE_AGGREGATION_OPERATORS.reduce((res, operator) => {
                            return {
                                ...res,
                                [`${field.fieldName}_${operator}`]: `${operator === "EQUAL" ? "String" : "Int"}`,
                                [`${field.fieldName}_AVERAGE_${operator}`]: "Float",
                                [`${field.fieldName}_LONGEST_${operator}`]: "Int",
                                [`${field.fieldName}_SHORTEST_${operator}`]: "Int",
                            };
                        }, {})
                    );

                    return;
                }

                if (WHERE_AGGREGATION_AVERAGE_TYPES.includes(field.typeMeta.name)) {
                    aggregationInput.addFields(
                        WHERE_AGGREGATION_OPERATORS.reduce((res, operator) => {
                            let averageType = "Float";

                            if (field.typeMeta.name === "BigInt") {
                                averageType = "BigInt";
                            }

                            if (field.typeMeta.name === "Duration") {
                                averageType = "Duration";
                            }

                            return {
                                ...res,
                                [`${field.fieldName}_${operator}`]: field.typeMeta.name,
                                [`${field.fieldName}_AVERAGE_${operator}`]: averageType,
                                [`${field.fieldName}_MIN_${operator}`]: field.typeMeta.name,
                                [`${field.fieldName}_MAX_${operator}`]: field.typeMeta.name,
                                ...(field.typeMeta.name !== "Duration"
                                    ? { [`${field.fieldName}_SUM_${operator}`]: field.typeMeta.name }
                                    : {}),
                            };
                        }, {})
                    );

                    return;
                }

                aggregationInput.addFields(
                    WHERE_AGGREGATION_OPERATORS.reduce(
                        (res, operator) => ({
                            ...res,
                            [`${field.fieldName}_${operator}`]: field.typeMeta.name,
                            [`${field.fieldName}_MIN_${operator}`]: field.typeMeta.name,
                            [`${field.fieldName}_MAX_${operator}`]: field.typeMeta.name,
                        }),
                        {}
                    )
                );
            });

            // eslint-disable-next-line consistent-return
            return aggregationInput;
        });

        const whereAggregateInput = schemaComposer.createInputTC({
            name: relationshipWhereTypeInputName,
            fields: {
                count: "Int",
                count_LT: "Int",
                count_LTE: "Int",
                count_GT: "Int",
                count_GTE: "Int",
                AND: `[${relationshipWhereTypeInputName}!]`,
                OR: `[${relationshipWhereTypeInputName}!]`,
                ...(nodeWhereAggregationInput ? { node: nodeWhereAggregationInput } : {}),
                ...(edgeWhereAggregationInput ? { edge: edgeWhereAggregationInput } : {}),
            },
        });

        whereInput.addFields({
            ...{
                [rel.fieldName]: `${n.name}Where`,
                [`${rel.fieldName}_NOT`]: `${n.name}Where`,
                [`${rel.fieldName}Aggregate`]: whereAggregateInput,
            },
        });

        const createName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}CreateFieldInput`;
        const create = rel.typeMeta.array ? `[${createName}!]` : createName;
        schemaComposer.getOrCreateITC(createName, (tc) => {
            tc.addFields({
                node: `${n.name}CreateInput!`,
                ...(hasNonGeneratedProperties
                    ? { edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` }
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
                ...(hasNonGeneratedProperties
                    ? { edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` }
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

        if (composeNode instanceof ObjectTypeComposer) {
            const baseTypeName = `${sourceName}${n.name}${upperFirst(rel.fieldName)}`;
            const fieldAggregationComposer = new FieldAggregationComposer(schemaComposer);

            const aggregationTypeObject = fieldAggregationComposer.createAggregationTypeObject(
                baseTypeName,
                n,
                relFields
            );

            composeNode.addFields({
                [`${rel.fieldName}Aggregate`]: {
                    type: aggregationTypeObject,
                    args: {
                        where: `${rel.typeMeta.name}Where`,
                    },
                },
            });
        }

        schemaComposer.getOrCreateITC(connectionUpdateInputName, (tc) => {
            tc.addFields({
                node: updateField,
                ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
            });
        });

        const connectOrCreate = createConnectOrCreateField({
            relationField: rel,
            node: n,
            schemaComposer,
            hasNonGeneratedProperties,
            hasNonNullNonGeneratedProperties,
        });

        const updateFields: Record<string, string> = {
            where: `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectionWhere`,
            update: connectionUpdateInputName,
            connect,
            disconnect: rel.typeMeta.array ? `[${nodeFieldDisconnectInputName}!]` : nodeFieldDisconnectInputName,
            create,
            delete: rel.typeMeta.array ? `[${nodeFieldDeleteInputName}!]` : nodeFieldDeleteInputName,
        };

        if (connectOrCreate) {
            updateFields.connectOrCreate = connectOrCreate;
        }

        schemaComposer.getOrCreateITC(nodeFieldUpdateInputName, (tc) => {
            tc.addFields(updateFields);
        });

        const mutationFields: Record<string, string> = {
            create,
            connect,
        };

        if (connectOrCreate) {
            mutationFields.connectOrCreate = connectOrCreate;
        }

        schemaComposer.getOrCreateITC(nodeFieldInputName, (tc) => {
            tc.addFields(mutationFields);
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

        if (n.uniqueFields.length) {
            createTopLevelConnectOrCreateInput({ schemaComposer, sourceName, rel });
        }
    });
}

function createTopLevelConnectOrCreateInput({
    schemaComposer,
    sourceName,
    rel,
}: {
    schemaComposer: SchemaComposer;
    sourceName: string;
    rel: RelationField;
}): void {
    const nodeConnectOrCreateInput: InputTypeComposer<any> = schemaComposer.getOrCreateITC(
        `${sourceName}ConnectOrCreateInput`
    );

    const nodeFieldConnectOrCreateInputName = `${rel.connectionPrefix}${upperFirst(
        rel.fieldName
    )}ConnectOrCreateFieldInput`;

    nodeConnectOrCreateInput.addFields({
        [rel.fieldName]: rel.typeMeta.array
            ? `[${nodeFieldConnectOrCreateInputName}!]`
            : nodeFieldConnectOrCreateInputName,
    });
}

export default createRelationshipFields;
