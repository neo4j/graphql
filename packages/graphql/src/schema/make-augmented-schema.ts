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

import { mergeTypeDefs } from "@graphql-tools/merge";
import { IExecutableSchemaDefinition, makeExecutableSchema } from "@graphql-tools/schema";
import { forEachField } from "@graphql-tools/utils";
import {
    DefinitionNode,
    DirectiveDefinitionNode,
    EnumTypeDefinitionNode,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLResolveInfo,
    GraphQLSchema,
    GraphQLString,
    InputObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    NamedTypeNode,
    ObjectTypeDefinitionNode,
    parse,
    print,
    ScalarTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import {
    upperFirst,
    SchemaComposer,
    InputTypeComposer,
    ObjectTypeComposer,
    InputTypeComposerFieldConfigAsObjectDefinition,
} from "graphql-compose";
import pluralize from "pluralize";
import { Node, Exclude } from "../classes";
import getAuth from "./get-auth";
import { PrimitiveField, Auth, ConnectionQueryArgs, BaseField } from "../types";
import {
    aggregateResolver,
    countResolver,
    createResolver,
    cypherResolver,
    defaultFieldResolver,
    deleteResolver,
    findResolver,
    updateResolver,
    numericalResolver,
    idResolver,
} from "./resolvers";
import * as Scalars from "./scalars";
import parseExcludeDirective from "./parse-exclude-directive";
import getCustomResolvers from "./get-custom-resolvers";
import getObjFieldMeta, { ObjectFields } from "./get-obj-field-meta";
import * as point from "./point";
import { graphqlDirectivesToCompose, objectFieldsToComposeFields } from "./to-compose";
import Relationship from "../classes/Relationship";
import getWhereFields from "./get-where-fields";
import { connectionFieldResolver } from "./pagination";
import { validateDocument } from "./validation";
import * as constants from "../constants";
import NodeDirective from "../classes/NodeDirective";
import parseNodeDirective from "./parse-node-directive";

function makeAugmentedSchema(
    { typeDefs, ...schemaDefinition }: IExecutableSchemaDefinition,
    { enableRegex, skipValidateTypeDefs }: { enableRegex?: boolean; skipValidateTypeDefs?: boolean } = {}
): { schema: GraphQLSchema; nodes: Node[]; relationships: Relationship[] } {
    const document = mergeTypeDefs(Array.isArray(typeDefs) ? (typeDefs as string[]) : [typeDefs as string]);

    if (!skipValidateTypeDefs) {
        validateDocument(document);
    }

    const composer = new SchemaComposer();

    // graphql-compose will break if the Point and CartesianPoint types are created but not used,
    // because it will purge the unused types but leave behind orphaned field resolvers
    //
    // These are flags to check whether the types are used and then create them if they are
    let pointInTypeDefs = false;
    let cartesianPointInTypeDefs = false;

    const relationships: Relationship[] = [];

    composer.createObjectTC({
        name: "CreateInfo",
        fields: {
            bookmark: GraphQLString,
            nodesCreated: new GraphQLNonNull(GraphQLInt),
            relationshipsCreated: new GraphQLNonNull(GraphQLInt),
        },
    });

    composer.createObjectTC({
        name: "DeleteInfo",
        fields: {
            bookmark: GraphQLString,
            nodesDeleted: new GraphQLNonNull(GraphQLInt),
            relationshipsDeleted: new GraphQLNonNull(GraphQLInt),
        },
    });

    composer.createObjectTC({
        name: "UpdateInfo",
        fields: {
            bookmark: GraphQLString,
            nodesCreated: new GraphQLNonNull(GraphQLInt),
            nodesDeleted: new GraphQLNonNull(GraphQLInt),
            relationshipsCreated: new GraphQLNonNull(GraphQLInt),
            relationshipsDeleted: new GraphQLNonNull(GraphQLInt),
        },
    });

    const composeInt = {
        type: "Int!",
        resolve: numericalResolver,
        args: {},
    };

    const composeFloat = {
        type: "Float!",
        resolve: numericalResolver,
        args: {},
    };

    const composeId = {
        type: "ID!",
        resolve: idResolver,
        args: {},
    };

    // Foreach i if i[1] is ? then we will assume it takes on type { min, max }
    const aggregationSelectionTypeMatrix: [string, any?][] = [
        [
            "ID",
            {
                shortest: composeId,
                longest: composeId,
            },
        ],
        [
            "String",
            {
                shortest: "String!",
                longest: "String!",
            },
        ],
        [
            "Float",
            {
                max: composeFloat,
                min: composeFloat,
                average: composeFloat,
            },
        ],
        [
            "Int",
            {
                max: composeInt,
                min: composeInt,
                average: composeFloat,
            },
        ],
        [
            "BigInt",
            {
                max: "BigInt!",
                min: "BigInt!",
                average: "BigInt!",
            },
        ],
        ["DateTime"],
        ["LocalDateTime"],
        ["LocalTime"],
        ["Time"],
        ["Duration"],
    ];

    const aggregationSelectionTypeNames = aggregationSelectionTypeMatrix.map(([name]) => name);

    const aggregationSelectionTypes = aggregationSelectionTypeMatrix.reduce<
        Record<string, ObjectTypeComposer<unknown, unknown>>
    >((res, [name, fields]) => {
        return {
            ...res,
            [name]: composer.createObjectTC({
                name: `${name}AggregateSelection`,
                fields: fields ?? { min: `${name}!`, max: `${name}!` },
            }),
        };
    }, {});

    const queryOptions = composer.createInputTC({
        name: "QueryOptions",
        fields: {
            offset: "Int",
            limit: "Int",
        },
    });

    const sortDirection = composer.createEnumTC({
        name: "SortDirection",
        values: {
            ASC: {
                value: "ASC",
                description: "Sort by field values in ascending order.",
            },
            DESC: {
                value: "DESC",
                description: "Sort by field values in descending order.",
            },
        },
    });

    composer.createObjectTC({
        name: "PageInfo",
        description: "Pagination information (Relay)",
        fields: {
            hasNextPage: "Boolean!",
            hasPreviousPage: "Boolean!",
            startCursor: "String",
            endCursor: "String",
        },
    });

    const customResolvers = getCustomResolvers(document);

    const scalars = document.definitions.filter((x) => x.kind === "ScalarTypeDefinition") as ScalarTypeDefinitionNode[];

    const objectNodes = document.definitions.filter(
        (x) => x.kind === "ObjectTypeDefinition" && !["Query", "Mutation", "Subscription"].includes(x.name.value)
    ) as ObjectTypeDefinitionNode[];

    const enums = document.definitions.filter((x) => x.kind === "EnumTypeDefinition") as EnumTypeDefinitionNode[];

    const inputs = document.definitions.filter(
        (x) => x.kind === "InputObjectTypeDefinition"
    ) as InputObjectTypeDefinitionNode[];

    let interfaces = document.definitions.filter(
        (x) => x.kind === "InterfaceTypeDefinition"
    ) as InterfaceTypeDefinitionNode[];

    const directives = document.definitions.filter(
        (x) => x.kind === "DirectiveDefinition"
    ) as DirectiveDefinitionNode[];

    const unions = document.definitions.filter((x) => x.kind === "UnionTypeDefinition") as UnionTypeDefinitionNode[];

    const relationshipPropertyInterfaceNames = new Set<string>();

    const extraDefinitions = [
        ...enums,
        ...scalars,
        ...directives,
        ...inputs,
        ...unions,
        ...([
            customResolvers.customQuery,
            customResolvers.customMutation,
            customResolvers.customSubscription,
        ] as ObjectTypeDefinitionNode[]),
    ].filter(Boolean) as DefinitionNode[];
    if (extraDefinitions.length) {
        composer.addTypeDefs(print({ kind: "Document", definitions: extraDefinitions }));
    }

    Object.keys(Scalars).forEach((scalar) => composer.addTypeDefs(`scalar ${scalar}`));

    const nodes = objectNodes.map((definition) => {
        constants.RESERVED_TYPE_NAMES.forEach(([label, message]) => {
            let toThrowError = false;

            if (label === "Connection" && definition.name.value.endsWith("Connection")) {
                toThrowError = true;
            }

            if (definition.name.value === label) {
                toThrowError = true;
            }

            if (toThrowError) {
                throw new Error(message);
            }
        });

        const otherDirectives = (definition.directives || []).filter(
            (x) => !["auth", "exclude", "node"].includes(x.name.value)
        );
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "node");
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        let auth: Auth;
        if (authDirective) {
            auth = getAuth(authDirective);
        }

        let exclude: Exclude;
        if (excludeDirective) {
            exclude = parseExcludeDirective(excludeDirective);
        }

        let nodeDirective: NodeDirective;
        if (nodeDirectiveDefinition) {
            nodeDirective = parseNodeDirective(nodeDirectiveDefinition);
        }

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums,
            interfaces,
            scalars,
            unions,
            objects: objectNodes,
        });

        nodeFields.relationFields.forEach((relationship) => {
            if (relationship.properties) {
                const propertiesInterface = interfaces.find((i) => i.name.value === relationship.properties);
                if (!propertiesInterface) {
                    throw new Error(
                        `Cannot find interface specified in ${definition.name.value}.${relationship.fieldName}`
                    );
                }
                relationshipPropertyInterfaceNames.add(relationship.properties);
            }
        });

        if (!pointInTypeDefs) {
            pointInTypeDefs = nodeFields.pointFields.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = nodeFields.pointFields.some((field) => field.typeMeta.name === "CartesianPoint");
        }

        const node = new Node({
            name: definition.name.value,
            interfaces: nodeInterfaces,
            otherDirectives,
            ...nodeFields,
            // @ts-ignore we can be sure it's defined
            auth,
            // @ts-ignore we can be sure it's defined
            exclude,
            // @ts-ignore we can be sure it's defined
            nodeDirective,
            description: definition.description?.value,
        });

        return node;
    });

    const relationshipProperties = interfaces.filter((i) => relationshipPropertyInterfaceNames.has(i.name.value));
    interfaces = interfaces.filter((i) => !relationshipPropertyInterfaceNames.has(i.name.value));

    const relationshipFields = new Map<string, ObjectFields>();

    relationshipProperties.forEach((relationship) => {
        constants.RESERVED_TYPE_NAMES.forEach(([label, message]) => {
            let toThrowError = false;

            if (label === "Connection" && relationship.name.value.endsWith("Connection")) {
                toThrowError = true;
            }

            if (relationship.name.value === label) {
                toThrowError = true;
            }

            if (toThrowError) {
                throw new Error(message);
            }
        });

        const authDirective = (relationship.directives || []).find((x) => x.name.value === "auth");
        if (authDirective) {
            throw new Error("Cannot have @auth directive on relationship properties interface");
        }

        relationship.fields?.forEach((field) => {
            constants.RESERVED_INTERFACE_FIELDS.forEach(([fieldName, message]) => {
                if (field.name.value === fieldName) {
                    throw new Error(message);
                }
            });

            const forbiddenDirectives = ["auth", "relationship", "cypher"];
            forbiddenDirectives.forEach((directive) => {
                const found = (field.directives || []).find((x) => x.name.value === directive);
                if (found) {
                    throw new Error(`Cannot have @${directive} directive on relationship property`);
                }
            });
        });

        const relFields = getObjFieldMeta({
            enums,
            interfaces,
            objects: objectNodes,
            scalars,
            unions,
            obj: relationship,
        });

        if (!pointInTypeDefs) {
            pointInTypeDefs = relFields.pointFields.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = relFields.pointFields.some((field) => field.typeMeta.name === "CartesianPoint");
        }

        relationshipFields.set(relationship.name.value, relFields);

        const objectComposeFields = objectFieldsToComposeFields(
            Object.values(relFields).reduce((acc, x) => [...acc, ...x], [])
        );

        const propertiesInterface = composer.createInterfaceTC({
            name: relationship.name.value,
            fields: objectComposeFields,
        });

        composer.createInputTC({
            name: `${relationship.name.value}Sort`,
            fields: propertiesInterface.getFieldNames().reduce((res, f) => {
                return { ...res, [f]: "SortDirection" };
            }, {}),
        });

        composer.createInputTC({
            name: `${relationship.name.value}UpdateInput`,
            fields: [
                ...relFields.primitiveFields.filter((field) => !field.autogenerate && !field.readonly),
                ...relFields.scalarFields,
                ...relFields.enumFields,
                ...relFields.temporalFields.filter((field) => !field.timestamps),
                ...relFields.pointFields,
            ].reduce(
                (res, f) => ({
                    ...res,
                    [f.fieldName]: f.typeMeta.input.update.pretty,
                }),
                {}
            ),
        });

        const relationshipWhereFields = getWhereFields({
            typeName: relationship.name.value,
            fields: {
                scalarFields: relFields.scalarFields,
                enumFields: relFields.enumFields,
                temporalFields: relFields.temporalFields,
                pointFields: relFields.pointFields,
                primitiveFields: relFields.primitiveFields,
            },
            enableRegex: enableRegex || false,
        });

        composer.createInputTC({
            name: `${relationship.name.value}Where`,
            fields: relationshipWhereFields,
        });

        composer.createInputTC({
            name: `${relationship.name.value}CreateInput`,
            // TODO - This reduce duplicated when creating node CreateInput - put into shared function?
            fields: [
                ...relFields.primitiveFields.filter((field) => !field.autogenerate),
                ...relFields.scalarFields,
                ...relFields.enumFields,
                ...relFields.temporalFields.filter((field) => !field.timestamps),
                ...relFields.pointFields,
            ].reduce((res, f) => {
                if ((f as PrimitiveField)?.defaultValue !== undefined) {
                    const field: InputTypeComposerFieldConfigAsObjectDefinition = {
                        type: f.typeMeta.input.create.pretty,
                        defaultValue: (f as PrimitiveField)?.defaultValue,
                    };
                    res[f.fieldName] = field;
                } else {
                    res[f.fieldName] = f.typeMeta.input.create.pretty;
                }

                return res;
            }, {}),
        });
    });

    if (pointInTypeDefs) {
        // Every field (apart from CRS) in Point needs a custom resolver
        // to deconstruct the point objects we fetch from the database
        composer.createObjectTC(point.point);
        composer.createInputTC(point.pointInput);
        composer.createInputTC(point.pointDistance);
    }

    if (cartesianPointInTypeDefs) {
        // Every field (apart from CRS) in CartesianPoint needs a custom resolver
        // to deconstruct the point objects we fetch from the database
        composer.createObjectTC(point.cartesianPoint);
        composer.createInputTC(point.cartesianPointInput);
        composer.createInputTC(point.cartesianPointDistance);
    }

    unions.forEach((union) => {
        if (union.types && union.types.length) {
            const fields = union.types.reduce((f, type) => {
                f = { ...f, [type.name.value]: `${type.name.value}Where` };
                return f;
            }, {});

            composer.createInputTC({
                name: `${union.name.value}Where`,
                fields,
            });
        }
    });

    nodes.forEach((node) => {
        const nodeFields = objectFieldsToComposeFields([
            ...node.primitiveFields,
            ...node.cypherFields,
            ...node.enumFields,
            ...node.scalarFields,
            ...node.interfaceFields,
            ...node.objectFields,
            ...node.unionFields,
            ...node.temporalFields,
            ...node.pointFields,
            ...node.ignoredFields,
        ]);

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: nodeFields,
            description: node.description,
            directives: graphqlDirectivesToCompose(node.otherDirectives),
            interfaces: node.interfaces.map((x) => x.name.value),
        });

        const sortFields = [
            ...node.primitiveFields,
            ...node.enumFields,
            ...node.scalarFields,
            ...node.temporalFields,
            ...node.pointFields,
        ].reduce((res, f) => {
            return f.typeMeta.array
                ? {
                      ...res,
                  }
                : {
                      ...res,
                      [f.fieldName]: sortDirection.getTypeName(),
                  };
        }, {});

        if (Object.keys(sortFields).length) {
            const sortInput = composer.createInputTC({
                name: `${node.name}Sort`,
                fields: sortFields,
                description: `Fields to sort ${pluralize(
                    node.name
                )} by. The order in which sorts are applied is not guaranteed when specifying many fields in one ${`${node.name}Sort`} object.`,
            });

            composer.createInputTC({
                name: `${node.name}Options`,
                fields: {
                    sort: {
                        description: `Specify one or more ${`${node.name}Sort`} objects to sort ${pluralize(
                            node.name
                        )} by. The sorts will be applied in the order in which they are arranged in the array.`,
                        type: sortInput.List,
                    },
                    limit: "Int",
                    offset: "Int",
                },
            });
        } else {
            composer.createInputTC({
                name: `${node.name}Options`,
                fields: { limit: "Int", offset: "Int" },
            });
        }

        const queryFields = getWhereFields({
            typeName: node.name,
            enableRegex,
            fields: {
                temporalFields: node.temporalFields,
                enumFields: node.enumFields,
                pointFields: node.pointFields,
                primitiveFields: node.primitiveFields,
                scalarFields: node.scalarFields,
            },
        });

        composer.createObjectTC({
            name: `${node.name}AggregateSelection`,
            fields: {
                count: composeInt,
                ...[...node.primitiveFields, ...node.temporalFields].reduce((res, field) => {
                    if (field.typeMeta.array) {
                        return res;
                    }

                    if (!aggregationSelectionTypeNames.includes(field.typeMeta.name)) {
                        return res;
                    }

                    const objectTypeComposer = (aggregationSelectionTypes[
                        field.typeMeta.name
                    ] as unknown) as ObjectTypeComposer<unknown, unknown>;

                    res[field.fieldName] = objectTypeComposer.NonNull;

                    return res;
                }, {}),
            },
        });

        const whereInput = composer.createInputTC({
            name: `${node.name}Where`,
            fields: queryFields,
        });

        const nodeInput = composer.createInputTC({
            name: `${node.name}CreateInput`,
            // TODO - This reduce duplicated when creating relationship CreateInput - put into shared function?
            fields: [
                ...node.primitiveFields,
                ...node.scalarFields,
                ...node.enumFields,
                ...node.temporalFields.filter((field) => !field.timestamps),
                ...node.pointFields,
            ].reduce((res, f) => {
                if ((f as PrimitiveField)?.autogenerate) {
                    return res;
                }

                if ((f as PrimitiveField)?.defaultValue !== undefined) {
                    const field: InputTypeComposerFieldConfigAsObjectDefinition = {
                        type: f.typeMeta.input.create.pretty,
                        defaultValue: (f as PrimitiveField)?.defaultValue,
                    };
                    res[f.fieldName] = field;
                } else {
                    res[f.fieldName] = f.typeMeta.input.create.pretty;
                }

                return res;
            }, {}),
        });

        const nodeUpdateInput = composer.createInputTC({
            name: `${node.name}UpdateInput`,
            fields: [
                ...node.primitiveFields,
                ...node.scalarFields,
                ...node.enumFields,
                ...node.temporalFields.filter((field) => !field.timestamps),
                ...node.pointFields,
            ].reduce(
                (res, f) =>
                    f.readonly || (f as PrimitiveField)?.autogenerate
                        ? res
                        : {
                              ...res,
                              [f.fieldName]: f.typeMeta.input.update.pretty,
                          },
                {}
            ),
        });

        const nodeDeleteInput = composer.createInputTC({
            name: `${node.name}DeleteInput`,
            fields: {},
        });

        ["Create", "Update"].map((operation) =>
            composer.createObjectTC({
                name: `${operation}${node.getPlural({ camelCase: false })}MutationResponse`,
                fields: {
                    info: `${operation}Info!`,
                    [node.getPlural({ camelCase: true })]: `[${node.name}!]!`,
                },
            })
        );

        let nodeConnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        let nodeDisconnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        let nodeRelationInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        if (node.relationFields.length) {
            [nodeConnectInput, nodeDisconnectInput, nodeRelationInput] = [
                "ConnectInput",
                "DisconnectInput",
                "RelationInput",
            ].map((type) =>
                composer.createInputTC({
                    name: `${node.name}${type}`,
                    fields: {},
                })
            );
        }

        node.relationFields.forEach((rel) => {
            let hasNonGeneratedProperties = false;
            let hasNonNullNonGeneratedProperties = false;
            let relFields: ObjectFields | undefined;

            if (rel.properties) {
                relFields = relationshipFields.get(rel.properties);

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
                }
            }

            if (rel.union) {
                const refNodes = nodes.filter((x) => rel.union?.nodes?.includes(x.name));

                composeNode.addFields({
                    [rel.fieldName]: {
                        type: rel.typeMeta.pretty,
                        args: {
                            options: queryOptions.getTypeName(),
                            where: `${rel.typeMeta.name}Where`,
                        },
                    },
                });

                const upperFieldName = upperFirst(rel.fieldName);
                const upperNodeName = upperFirst(node.name);
                const typePrefix = `${upperNodeName}${upperFieldName}`;

                const [
                    unionConnectInput,
                    unionCreateInput,
                    unionDeleteInput,
                    unionDisconnectInput,
                    unionUpdateInput,
                ] = ["Connect", "Create", "Delete", "Disconnect", "Update"].map((operation) =>
                    composer.createInputTC({
                        name: `${typePrefix}${operation}Input`,
                        fields: {},
                    })
                );

                const unionCreateFieldInput = composer.createInputTC({
                    name: `${typePrefix}CreateFieldInput`,
                    fields: {},
                });

                refNodes.forEach((n) => {
                    const unionPrefix = `${node.name}${upperFieldName}${n.name}`;
                    const updateField = `${n.name}UpdateInput`;
                    const nodeFieldInputName = `${unionPrefix}FieldInput`;
                    const whereName = `${unionPrefix}ConnectionWhere`;

                    const deleteName = `${unionPrefix}DeleteFieldInput`;
                    const _delete = rel.typeMeta.array ? `[${deleteName}!]` : `${deleteName}`;

                    const disconnectName = `${unionPrefix}DisconnectFieldInput`;
                    const disconnect = rel.typeMeta.array ? `[${disconnectName}!]` : `${disconnectName}`;

                    const connectionUpdateInputName = `${unionPrefix}UpdateConnectionInput`;

                    const createName = `${node.name}${upperFirst(rel.fieldName)}${n.name}CreateFieldInput`;
                    const create = rel.typeMeta.array ? `[${createName}!]` : createName;
                    if (!composer.has(createName)) {
                        composer.createInputTC({
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
                    if (!composer.has(connectWhereName)) {
                        composer.createInputTC({
                            name: connectWhereName,
                            fields: {
                                node: `${n.name}Where!`,
                            },
                        });
                    }

                    const connectName = `${unionPrefix}ConnectFieldInput`;
                    const connect = rel.typeMeta.array ? `[${connectName}!]` : `${connectName}`;
                    if (!composer.has(connectName)) {
                        composer.createInputTC({
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

                    const updateName = `${unionPrefix}UpdateFieldInput`;
                    const update = rel.typeMeta.array ? `[${updateName}!]` : updateName;
                    if (!composer.has(updateName)) {
                        composer.createInputTC({
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

                    composer.createInputTC({
                        name: connectionUpdateInputName,
                        fields: {
                            ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
                            node: updateField,
                        },
                    });

                    composer.createInputTC({
                        name: nodeFieldInputName,
                        fields: {
                            create,
                            connect,
                        },
                    });

                    composer.createInputTC({
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

                    if (!composer.has(deleteName)) {
                        composer.createInputTC({
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

                    if (!composer.has(disconnectName)) {
                        composer.createInputTC({
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

                nodeInput.addFields({
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

            const nodeFieldInputName = `${node.name}${upperFirst(rel.fieldName)}FieldInput`;
            const nodeFieldUpdateInputName = `${node.name}${upperFirst(rel.fieldName)}UpdateFieldInput`;
            const nodeFieldDeleteInputName = `${node.name}${upperFirst(rel.fieldName)}DeleteFieldInput`;
            const nodeFieldDisconnectInputName = `${node.name}${upperFirst(rel.fieldName)}DisconnectFieldInput`;
            const connectionUpdateInputName = `${node.name}${upperFirst(rel.fieldName)}UpdateConnectionInput`;
            const relationshipWhereTypeInputName = `${node.name}${upperFirst(rel.fieldName)}AggregateInput`;

            const thisAggregationSelectionTypeMatrix: [string, any?][] = [
                ["ID"],
                ["String"],
                ["Float"],
                ["Int"],
                ["BigInt"],
                ["DateTime"],
                ["LocalDateTime"],
                ["LocalTime"],
                ["Time"],
                ["Duration"],
            ];

            const nodeWhereAggregationInputFields = thisAggregationSelectionTypeMatrix.reduce<BaseField[]>((res, x) => {
                const field = [...n.primitiveFields, ...n.temporalFields].find(
                    (y) => !y.typeMeta.array && y.typeMeta.name === x[0]
                );

                if (!field) {
                    return res;
                }

                return res.concat(field);
            }, []);

            let nodeWhereAggregationInput: InputTypeComposer<any> | undefined;

            if (nodeWhereAggregationInputFields.length) {
                const name = `${node.name}${upperFirst(rel.fieldName)}NodeAggregationWhereInput`;

                nodeWhereAggregationInput = composer.createInputTC({
                    name,
                    fields: {},
                });

                nodeWhereAggregationInputFields.forEach((field) => {
                    // const matrixItem = thisAggregationSelectionTypeMatrix.find((x) => x[0] === field.typeMeta.name) as [
                    //     string,
                    //     any
                    // ];

                    // TODO average?
                    const operators = ["EQUAL", "GT", "GTE", "LT", "LTE"];

                    if (field.typeMeta.name === "ID") {
                        nodeWhereAggregationInput?.addFields({
                            [`${field.fieldName}_EQUAL`]: "ID",
                        });
                    }

                    if (field.typeMeta.name === "String") {
                        nodeWhereAggregationInput?.addFields({
                            [`${field.fieldName}_EQUAL`]: "ID",
                            ...operators.reduce((r, o) => {
                                if (o === "EQUAL") {
                                    return r;
                                }

                                return { ...r, [`${field.fieldName}_${o}`]: "Int" };
                            }, {}),
                        });
                    }

                    if (field.typeMeta.name === "Float") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "Float" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "Int") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "Int" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "BigInt") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "BigInt" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "DateTime") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "DateTime" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "LocalDateTime") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "LocalDateTime" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "LocalTime") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "LocalTime" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "Time") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "Time" }), {}),
                        });
                    }

                    if (field.typeMeta.name === "Duration") {
                        nodeWhereAggregationInput?.addFields({
                            ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "Duration" }), {}),
                        });
                    }
                });
            }

            let edgeWhereAggregationInput: InputTypeComposer<any> | undefined;

            if (relFields !== undefined) {
                const edgeWhereAggregationInputFields = thisAggregationSelectionTypeMatrix.reduce<BaseField[]>(
                    (res, x) => {
                        // @ts-ignore - Go home TypeScript your drunk
                        // ...relFields.temporalFields
                        const field = [...relFields.primitiveFields].find(
                            (y) => !y.typeMeta.array && y.typeMeta.name === x[0]
                        );

                        if (!field) {
                            return res;
                        }

                        return res.concat(field);
                    },
                    []
                );

                if (edgeWhereAggregationInputFields.length) {
                    const name = `${node.name}${upperFirst(rel.fieldName)}EdgeAggregationWhereInput`;

                    edgeWhereAggregationInput = composer.createInputTC({
                        name,
                        fields: {},
                    });

                    edgeWhereAggregationInputFields.forEach((field) => {
                        // TODO average?
                        const operators = ["EQUAL", "GT", "GTE", "LT", "LTE"];

                        if (field.typeMeta.name === "ID") {
                            edgeWhereAggregationInput?.addFields({
                                [`${field.fieldName}_EQUAL`]: "ID",
                            });
                        }

                        if (field.typeMeta.name === "String") {
                            edgeWhereAggregationInput?.addFields({
                                [`${field.fieldName}_EQUAL`]: "ID",
                                ...operators.reduce((r, o) => {
                                    if (o === "EQUAL") {
                                        return r;
                                    }

                                    return { ...r, [`${field.fieldName}_${o}`]: "Int" };
                                }, {}),
                            });
                        }

                        if (field.typeMeta.name === "Int") {
                            edgeWhereAggregationInput?.addFields({
                                ...operators.reduce((r, o) => ({ ...r, [`${field.fieldName}_${o}`]: "Int" }), {}),
                            });
                        }
                    });
                }
            }

            const whereAggregateInput = composer.createInputTC({
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
                [rel.fieldName]: `${n.name}Where`,
                [`${rel.fieldName}_NOT`]: `${n.name}Where`,
                [`${rel.fieldName}Aggregate`]: whereAggregateInput,
            });

            const createName = `${node.name}${upperFirst(rel.fieldName)}CreateFieldInput`;
            const create = rel.typeMeta.array ? `[${createName}!]` : createName;
            if (!composer.has(createName)) {
                composer.createInputTC({
                    name: createName,
                    fields: {
                        node: `${n.name}CreateInput!`,
                        ...(hasNonGeneratedProperties
                            ? { edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` }
                            : {}),
                    },
                });
            }

            const connectWhereName = `${n.name}ConnectWhere`;
            if (!composer.has(connectWhereName)) {
                composer.createInputTC({
                    name: connectWhereName,
                    fields: {
                        node: `${n.name}Where!`,
                    },
                });
            }

            const connectName = `${node.name}${upperFirst(rel.fieldName)}ConnectFieldInput`;
            const connect = rel.typeMeta.array ? `[${connectName}!]` : connectName;
            if (!composer.has(connectName)) {
                composer.createInputTC({
                    name: connectName,
                    fields: {
                        where: connectWhereName,
                        ...(n.relationFields.length
                            ? { connect: rel.typeMeta.array ? `[${n.name}ConnectInput!]` : `${n.name}ConnectInput` }
                            : {}),
                        ...(hasNonGeneratedProperties
                            ? { edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` }
                            : {}),
                    },
                });
            }

            composeNode.addFields({
                [rel.fieldName]: {
                    type: rel.typeMeta.pretty,
                    args: {
                        where: `${rel.typeMeta.name}Where`,
                        options: `${rel.typeMeta.name}Options`,
                    },
                },
            });

            composer.createInputTC({
                name: connectionUpdateInputName,
                fields: {
                    node: updateField,
                    ...(hasNonGeneratedProperties ? { edge: `${rel.properties}UpdateInput` } : {}),
                },
            });

            composer.createInputTC({
                name: nodeFieldUpdateInputName,
                fields: {
                    where: `${node.name}${upperFirst(rel.fieldName)}ConnectionWhere`,
                    update: connectionUpdateInputName,
                    connect,
                    disconnect: rel.typeMeta.array
                        ? `[${nodeFieldDisconnectInputName}!]`
                        : nodeFieldDisconnectInputName,
                    create,
                    delete: rel.typeMeta.array ? `[${nodeFieldDeleteInputName}!]` : nodeFieldDeleteInputName,
                },
            });

            composer.createInputTC({
                name: nodeFieldInputName,
                fields: {
                    create,
                    connect,
                },
            });

            if (!composer.has(nodeFieldDeleteInputName)) {
                composer.createInputTC({
                    name: nodeFieldDeleteInputName,
                    fields: {
                        where: `${node.name}${upperFirst(rel.fieldName)}ConnectionWhere`,
                        ...(n.relationFields.length ? { delete: `${n.name}DeleteInput` } : {}),
                    },
                });
            }

            if (!composer.has(nodeFieldDisconnectInputName)) {
                composer.createInputTC({
                    name: nodeFieldDisconnectInputName,
                    fields: {
                        where: `${node.name}${upperFirst(rel.fieldName)}ConnectionWhere`,
                        ...(n.relationFields.length ? { disconnect: `${n.name}DisconnectInput` } : {}),
                    },
                });
            }

            nodeRelationInput.addFields({
                [rel.fieldName]: create,
            });

            nodeInput.addFields({
                [rel.fieldName]: nodeFieldInputName,
            });

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
                [rel.fieldName]: rel.typeMeta.array
                    ? `[${nodeFieldDisconnectInputName}!]`
                    : nodeFieldDisconnectInputName,
            });
        });

        node.connectionFields.forEach((connectionField) => {
            const relationship = composer.createObjectTC({
                name: connectionField.relationshipTypeName,
                fields: {
                    cursor: "String!",
                    node: `${connectionField.relationship.typeMeta.name}!`,
                },
            });

            const connectionWhereName = `${connectionField.typeMeta.name}Where`;

            const connectionWhere = composer.createInputTC({
                name: connectionWhereName,
                fields: {},
            });

            if (!connectionField.relationship.union) {
                connectionWhere.addFields({
                    AND: `[${connectionWhereName}!]`,
                    OR: `[${connectionWhereName}!]`,
                });
            }

            const connection = composer.createObjectTC({
                name: connectionField.typeMeta.name,
                fields: {
                    edges: relationship.NonNull.List.NonNull,
                    totalCount: "Int!",
                    pageInfo: "PageInfo!",
                },
            });

            if (connectionField.relationship.properties && !connectionField.relationship.union) {
                const propertiesInterface = composer.getIFTC(connectionField.relationship.properties);
                relationship.addInterface(propertiesInterface);
                relationship.addFields(propertiesInterface.getFields());

                connectionWhere.addFields({
                    edge: `${connectionField.relationship.properties}Where`,
                    edge_NOT: `${connectionField.relationship.properties}Where`,
                });
            }

            whereInput.addFields({
                [connectionField.fieldName]: connectionWhere,
                [`${connectionField.fieldName}_NOT`]: connectionWhere,
            });

            let composeNodeArgs: {
                where: any;
                sort?: any;
                first?: any;
                after?: any;
            } = {
                where: connectionWhere,
            };

            if (connectionField.relationship.union) {
                const relatedNodes = nodes.filter((n) => connectionField.relationship.union?.nodes?.includes(n.name));

                relatedNodes.forEach((n) => {
                    const unionWhereName = `${connectionField.typeMeta.name}${n.name}Where`;
                    const unionWhere = composer.createInputTC({
                        name: unionWhereName,
                        fields: {
                            OR: `[${unionWhereName}]`,
                            AND: `[${unionWhereName}]`,
                        },
                    });

                    unionWhere.addFields({
                        node: `${n.name}Where`,
                        node_NOT: `${n.name}Where`,
                    });

                    if (connectionField.relationship.properties) {
                        const propertiesInterface = composer.getIFTC(connectionField.relationship.properties);
                        relationship.addInterface(propertiesInterface);
                        relationship.addFields(propertiesInterface.getFields());

                        unionWhere.addFields({
                            edge: `${connectionField.relationship.properties}Where`,
                            edge_NOT: `${connectionField.relationship.properties}Where`,
                        });
                    }

                    connectionWhere.addFields({
                        [n.name]: unionWhere,
                    });
                });
            } else {
                const relatedNode = nodes.find((n) => n.name === connectionField.relationship.typeMeta.name) as Node;

                connectionWhere.addFields({
                    node: `${connectionField.relationship.typeMeta.name}Where`,
                    node_NOT: `${connectionField.relationship.typeMeta.name}Where`,
                });

                const connectionSort = composer.createInputTC({
                    name: `${connectionField.typeMeta.name}Sort`,
                    fields: {},
                });

                const nodeSortFields = [
                    ...relatedNode.primitiveFields,
                    ...relatedNode.enumFields,
                    ...relatedNode.scalarFields,
                    ...relatedNode.temporalFields,
                    ...relatedNode.pointFields,
                ].filter((f) => !f.typeMeta.array);

                if (nodeSortFields.length) {
                    connectionSort.addFields({
                        node: `${connectionField.relationship.typeMeta.name}Sort`,
                    });
                }

                if (connectionField.relationship.properties) {
                    connectionSort.addFields({
                        edge: `${connectionField.relationship.properties}Sort`,
                    });
                }

                composeNodeArgs = {
                    ...composeNodeArgs,
                    first: {
                        type: "Int",
                    },
                    after: {
                        type: "String",
                    },
                };

                // If any sortable fields, add sort argument to connection field
                if (nodeSortFields.length || connectionField.relationship.properties) {
                    composeNodeArgs = {
                        ...composeNodeArgs,
                        sort: connectionSort.NonNull.List,
                    };
                }
            }

            composeNode.addFields({
                [connectionField.fieldName]: {
                    type: connection.NonNull,
                    args: composeNodeArgs,
                    resolve: (source, args: ConnectionQueryArgs, ctx, info: GraphQLResolveInfo) => {
                        return connectionFieldResolver({
                            connectionField,
                            args,
                            info,
                            source,
                        });
                    },
                },
            });

            const relFields = connectionField.relationship.properties
                ? relationshipFields.get(connectionField.relationship.properties)
                : ({} as ObjectFields | undefined);

            const r = new Relationship({
                name: connectionField.relationshipTypeName,
                type: connectionField.relationship.type,
                properties: connectionField.relationship.properties,
                ...(relFields
                    ? {
                          temporalFields: relFields.temporalFields,
                          scalarFields: relFields.scalarFields,
                          primitiveFields: relFields.primitiveFields,
                          pointFields: relFields.pointFields,
                          ignoredFields: relFields.ignoredFields,
                      }
                    : {}),
            });
            relationships.push(r);
        });

        if (!node.exclude?.operations.includes("read")) {
            composer.Query.addFields({
                [node.getPlural({ camelCase: true })]: findResolver({ node }),
            });

            composer.Query.addFields({
                [`${node.getPlural({ camelCase: true })}Count`]: countResolver({ node }),
            });

            composer.Query.addFields({
                [`${node.getPlural({ camelCase: true })}Aggregate`]: aggregateResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("create")) {
            composer.Mutation.addFields({
                [`create${node.getPlural({ camelCase: false })}`]: createResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("delete")) {
            composer.Mutation.addFields({
                [`delete${node.getPlural({ camelCase: false })}`]: deleteResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("update")) {
            composer.Mutation.addFields({
                [`update${node.getPlural({ camelCase: false })}`]: updateResolver({ node }),
            });
        }
    });

    ["Mutation", "Query"].forEach((type) => {
        const objectComposer = composer[type] as ObjectTypeComposer;
        const cypherType = customResolvers[`customCypher${type}`] as ObjectTypeDefinitionNode;

        if (cypherType) {
            const objectFields = getObjFieldMeta({
                obj: cypherType,
                scalars,
                enums,
                interfaces,
                unions,
                objects: objectNodes,
            });

            const objectComposeFields = objectFieldsToComposeFields([
                ...objectFields.enumFields,
                ...objectFields.interfaceFields,
                ...objectFields.primitiveFields,
                ...objectFields.relationFields,
                ...objectFields.scalarFields,
                ...objectFields.unionFields,
                ...objectFields.objectFields,
                ...objectFields.temporalFields,
            ]);

            objectComposer.addFields(objectComposeFields);

            objectFields.cypherFields.forEach((field) => {
                const customResolver = cypherResolver({
                    field,
                    statement: field.statement,
                    type: type as "Query" | "Mutation",
                });

                const composedField = objectFieldsToComposeFields([field])[field.fieldName];

                objectComposer.addFields({ [field.fieldName]: { ...composedField, ...customResolver } });
            });
        }
    });

    interfaces.forEach((inter) => {
        const objectFields = getObjFieldMeta({ obj: inter, scalars, enums, interfaces, unions, objects: objectNodes });

        const objectComposeFields = objectFieldsToComposeFields(
            Object.values(objectFields).reduce((acc, x) => [...acc, ...x], [])
        );

        composer.createInterfaceTC({
            name: inter.name.value,
            description: inter.description?.value,
            fields: objectComposeFields,
            directives: graphqlDirectivesToCompose((inter.directives || []).filter((x) => x.name.value !== "auth")),
        });
    });

    if (!Object.values(composer.Mutation.getFields()).length) {
        composer.delete("Mutation");
    }

    const generatedTypeDefs = composer.toSDL();
    let parsedDoc = parse(generatedTypeDefs);
    // @ts-ignore
    const documentNames = parsedDoc.definitions.filter((x) => "name" in x).map((x) => x.name.value);

    const generatedResolvers = {
        ...Object.entries(composer.getResolveMethods()).reduce((res, [key, value]) => {
            if (!documentNames.includes(key)) {
                return res;
            }

            return { ...res, [key]: value };
        }, {}),
        ...Object.entries(Scalars).reduce((res, [name, scalar]) => {
            if (generatedTypeDefs.includes(`scalar ${name}\n`)) {
                res[name] = scalar;
            }
            return res;
        }, {}),
    };

    unions.forEach((union) => {
        if (!generatedResolvers[union.name.value]) {
            // eslint-disable-next-line no-underscore-dangle
            generatedResolvers[union.name.value] = { __resolveType: (root) => root.__resolveType };
        }
    });

    const seen = {};
    parsedDoc = {
        ...parsedDoc,
        definitions: parsedDoc.definitions.filter((definition) => {
            if (!("name" in definition)) {
                return true;
            }

            const n = definition.name?.value as string;

            if (seen[n]) {
                return false;
            }

            seen[n] = n;

            return true;
        }),
    };

    const schema = makeExecutableSchema({
        ...schemaDefinition,
        typeDefs: parsedDoc,
        resolvers: generatedResolvers,
    });

    // Assign a default field resolver to account for aliasing of fields
    forEachField(schema, (field) => {
        if (!field.resolve) {
            // eslint-disable-next-line no-param-reassign
            field.resolve = defaultFieldResolver;
        }
    });

    return {
        nodes,
        relationships,
        schema,
    };
}

export default makeAugmentedSchema;
