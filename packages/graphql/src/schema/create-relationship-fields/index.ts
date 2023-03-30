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

import type { Directive, InputTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { Node } from "../../classes";
import {
    WHERE_AGGREGATION_AVERAGE_TYPES,
    AGGREGATION_COMPARISON_OPERATORS,
    WHERE_AGGREGATION_TYPES,
} from "../../constants";
import type { BaseField, RelationField } from "../../types";
import type { ObjectFields } from "../get-obj-field-meta";
import { createConnectOrCreateField } from "./create-connect-or-create-field";
import { FieldAggregationComposer } from "../aggregations/field-aggregation-composer";
import { upperFirst } from "../../utils/upper-first";
import { addDirectedArgument } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { overwrite } from "./fields/overwrite";
import {
    DEPRECATE_NOT,
    DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS,
    DEPRECATE_INVALID_AGGREGATION_FILTERS,
} from "../constants";
import { addRelationshipArrayFilters } from "../augment/add-relationship-array-filters";

function createRelationshipFields({
    relationshipFields,
    schemaComposer,
    // TODO: Ideally we come up with a solution where we don't have to pass the following into these kind of functions
    composeNode,
    sourceName,
    nodes,
    relationshipPropertyFields,
    subgraph,
}: {
    relationshipFields: RelationField[];
    schemaComposer: SchemaComposer;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    sourceName: string;
    nodes: Node[];
    relationshipPropertyFields: Map<string, ObjectFields>;
    subgraph?: Subgraph;
}): void {
    const whereInput = schemaComposer.getITC(`${sourceName}Where`);
    const nodeCreateInput = schemaComposer.getITC(`${sourceName}CreateInput`);
    const nodeUpdateInput = schemaComposer.getITC(`${sourceName}UpdateInput`);

    let nodeConnectInput: InputTypeComposer<any>;
    let nodeDeleteInput: InputTypeComposer<any>;
    let nodeDisconnectInput: InputTypeComposer<any>;
    let nodeRelationInput: InputTypeComposer<any>;

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

        const deprecatedDirectives = graphqlDirectivesToCompose(
            rel.otherDirectives.filter((directive) => directive.name.value === "deprecated")
        );

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

            const connectFieldInput = schemaComposer.getOrCreateITC(
                `${sourceName}${upperFirst(rel.fieldName)}ConnectFieldInput`,
                (tc) => {
                    tc.addFields({
                        ...(schemaComposer.has(`${rel.typeMeta.name}ConnectInput`)
                            ? { connect: `${rel.typeMeta.name}ConnectInput` }
                            : {}),
                        ...(hasNonGeneratedProperties
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
                    if (hasNonGeneratedProperties) {
                        tc.addFields({
                            edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}`,
                        });
                    }
                }
            );

            schemaComposer.getOrCreateITC(`${sourceName}${upperFirst(rel.fieldName)}UpdateConnectionInput`, (tc) => {
                tc.addFields({
                    ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
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
                            ...(hasNonGeneratedProperties
                                ? { edge: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
                                : {}),
                        },
                    });
                }
            });

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

            return;
        }

        if (rel.union) {
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
                                      edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}`,
                                  }
                                : {}),
                        },
                    });

                    unionCreateInput.addFields({
                        [n.name]: nodeFieldInputName,
                    });

                    unionCreateFieldInput.addFields({
                        [n.name]:  rel.typeMeta.array ? `[${createName}!]` : createName,
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

        whereInput.addFields({
            [rel.fieldName]: {
                type: `${n.name}Where`,
            },
            [`${rel.fieldName}_NOT`]: {
                type: `${n.name}Where`,
            },
        });

        if (rel.typeMeta.array) {
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
                        NOT: name,
                    },
                });

                fields.forEach((field) => {
                    if (field.typeMeta.name === "ID") {
                        aggregationInput.addFields({
                            [`${field.fieldName}_EQUAL`]: {
                                type: `ID`,
                                directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                            },
                        });

                        return;
                    }

                    if (field.typeMeta.name === "String") {
                        aggregationInput.addFields(
                            AGGREGATION_COMPARISON_OPERATORS.reduce((res, operator) => {
                                return {
                                    ...res,
                                    [`${field.fieldName}_${operator}`]: {
                                        type: `${operator === "EQUAL" ? "String" : "Int"}`,
                                        directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                                    },
                                    [`${field.fieldName}_AVERAGE_${operator}`]: {
                                        type: "Float",
                                        directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                                    },
                                    [`${field.fieldName}_LONGEST_${operator}`]: {
                                        type: "Int",
                                        directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                                    },
                                    [`${field.fieldName}_SHORTEST_${operator}`]: {
                                        type: "Int",
                                        directives: [DEPRECATE_IMPLICIT_LENGTH_AGGREGATION_FILTERS],
                                    },
                                    [`${field.fieldName}_AVERAGE_LENGTH_${operator}`]: "Float",
                                    [`${field.fieldName}_LONGEST_LENGTH_${operator}`]: "Int",
                                    [`${field.fieldName}_SHORTEST_LENGTH_${operator}`]: "Int",
                                };
                            }, {})
                        );

                        return;
                    }

                    if (WHERE_AGGREGATION_AVERAGE_TYPES.includes(field.typeMeta.name)) {
                        aggregationInput.addFields(
                            AGGREGATION_COMPARISON_OPERATORS.reduce((res, operator) => {
                                let averageType = "Float";

                                if (field.typeMeta.name === "BigInt") {
                                    averageType = "BigInt";
                                }

                                if (field.typeMeta.name === "Duration") {
                                    averageType = "Duration";
                                }

                                return {
                                    ...res,
                                    [`${field.fieldName}_${operator}`]: {
                                        type: field.typeMeta.name,
                                        directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                                    },
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
                        AGGREGATION_COMPARISON_OPERATORS.reduce(
                            (res, operator) => ({
                                ...res,
                                [`${field.fieldName}_${operator}`]: {
                                    type: field.typeMeta.name,
                                    directives: [DEPRECATE_INVALID_AGGREGATION_FILTERS],
                                },
                                [`${field.fieldName}_MIN_${operator}`]: field.typeMeta.name,
                                [`${field.fieldName}_MAX_${operator}`]: field.typeMeta.name,
                            }),
                            {}
                        )
                    );
                });

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
                    NOT: relationshipWhereTypeInputName,
                    ...(nodeWhereAggregationInput ? { node: nodeWhereAggregationInput } : {}),
                    ...(edgeWhereAggregationInput ? { edge: edgeWhereAggregationInput } : {}),
                },
            });

            whereInput.addFields({
                [`${rel.fieldName}Aggregate`]: {
                    type: whereAggregateInput,
                    directives: deprecatedDirectives,
                },
            });

            addRelationshipArrayFilters({
                whereInput,
                fieldName: rel.fieldName,
                sourceName,
                relatedType: rel.typeMeta.name,
                whereType: `${n.name}Where`,
                directives: deprecatedDirectives,
            });
        }

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
                overwrite,
            });
            tc.makeFieldNonNull("overwrite");
        });

        if (!rel.writeonly) {
            const relationshipField: { type: string; description?: string; directives: Directive[]; args?: any } = {
                type: rel.typeMeta.pretty,
                description: rel.description,
                directives: graphqlDirectivesToCompose(rel.otherDirectives),
            };

            let generateRelFieldArgs = true;

            // Subgraph schemas do not support arguments on relationship fields (singular)
            if (subgraph) {
                if (!rel.typeMeta.array) {
                    generateRelFieldArgs = false;
                }
            }

            if (generateRelFieldArgs) {
                const nodeFieldsBaseArgs = {
                    where: `${rel.typeMeta.name}Where`,
                    options: `${rel.typeMeta.name}Options`,
                };
                const nodeFieldsArgs = addDirectedArgument(nodeFieldsBaseArgs, rel);
                relationshipField.args = nodeFieldsArgs;
            }

            composeNode.addFields({
                [rel.fieldName]: relationshipField,
            });

            if (composeNode instanceof ObjectTypeComposer && rel.typeMeta.array) {
                const baseTypeName = `${sourceName}${n.name}${upperFirst(rel.fieldName)}`;
                const fieldAggregationComposer = new FieldAggregationComposer(schemaComposer, subgraph);

                const aggregationTypeObject = fieldAggregationComposer.createAggregationTypeObject(
                    baseTypeName,
                    n,
                    relFields
                );

                const aggregationFieldsBaseArgs = {
                    where: `${rel.typeMeta.name}Where`,
                };

                const aggregationFieldsArgs = addDirectedArgument(aggregationFieldsBaseArgs, rel);

                composeNode.addFields({
                    [`${rel.fieldName}Aggregate`]: {
                        type: aggregationTypeObject,
                        args: aggregationFieldsArgs,
                        directives: deprecatedDirectives,
                    },
                });
            }
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
            [rel.fieldName]: {
                type: create,
                directives: deprecatedDirectives,
            },
        });

        if (!(composeNode instanceof InterfaceTypeComposer)) {
            nodeCreateInput.addFields({
                [rel.fieldName]: {
                    type: nodeFieldInputName,
                    directives: deprecatedDirectives,
                },
            });
        }

        nodeUpdateInput.addFields({
            [rel.fieldName]: {
                type: rel.typeMeta.array ? `[${nodeFieldUpdateInputName}!]` : nodeFieldUpdateInputName,
                directives: deprecatedDirectives,
            },
        });

        nodeDeleteInput.addFields({
            [rel.fieldName]: {
                type: rel.typeMeta.array ? `[${nodeFieldDeleteInputName}!]` : nodeFieldDeleteInputName,
                directives: deprecatedDirectives,
            },
        });

        nodeConnectInput.addFields({
            [rel.fieldName]: {
                type: connect,
                directives: deprecatedDirectives,
            },
        });

        nodeDisconnectInput.addFields({
            [rel.fieldName]: {
                type: rel.typeMeta.array ? `[${nodeFieldDisconnectInputName}!]` : nodeFieldDisconnectInputName,
                directives: deprecatedDirectives,
            },
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
