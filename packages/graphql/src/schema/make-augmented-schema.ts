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
import camelCase from "camelcase";
import {
    DefinitionNode,
    DirectiveDefinitionNode,
    EnumTypeDefinitionNode,
    GraphQLSchema,
    InputObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    NamedTypeNode,
    ObjectTypeDefinitionNode,
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
    ObjectTypeComposerFieldConfigAsObjectDefinition,
} from "graphql-compose";
import pluralize from "pluralize";
import { Integer, isInt } from "neo4j-driver";
import { Node, Exclude } from "../classes";
import getAuth from "./get-auth";
import { PrimitiveField, Auth, CustomEnumField, ConnectionQueryArgs } from "../types";
import { findResolver, createResolver, deleteResolver, cypherResolver, updateResolver } from "./resolvers";
import checkNodeImplementsInterfaces from "./check-node-implements-interfaces";
import * as Scalars from "./scalars";
import parseExcludeDirective from "./parse-exclude-directive";
import getCustomResolvers from "./get-custom-resolvers";
import getObjFieldMeta from "./get-obj-field-meta";
import * as point from "./point";
import { graphqlDirectivesToCompose, objectFieldsToComposeFields } from "./to-compose";
import getFieldTypeMeta from "./get-field-type-meta";
import Relationship, { RelationshipField } from "../classes/Relationship";
import getRelationshipFieldMeta from "./get-relationship-field-meta";
import getWhereFields from "./get-where-fields";
import { createConnectionWithEdgeProperties } from "./pagination";
// import validateTypeDefs from "./validation";

function makeAugmentedSchema(
    { typeDefs, ...schemaDefinition }: IExecutableSchemaDefinition,
    { enableRegex }: { enableRegex?: boolean } = {}
): { schema: GraphQLSchema; nodes: Node[]; relationships: Relationship[] } {
    const document = mergeTypeDefs(Array.isArray(typeDefs) ? (typeDefs as string[]) : [typeDefs as string]);

    /*
        Issue caused by a combination of GraphQL Compose removing types and
        that we are not adding Points to the validation schema. This should be a
        temporary fix and does not detriment usability of the library.
    */
    // validateTypeDefs(document);

    const composer = new SchemaComposer();

    // graphql-compose will break if the Point and CartesianPoint types are created but not used,
    // because it will purge the unused types but leave behind orphaned field resolvers
    //
    // These are flags to check whether the types are used and then create them if they are
    let pointInTypeDefs = false;
    let cartesianPointInTypeDefs = false;

    const relationships: Relationship[] = [];

    composer.createObjectTC({
        name: "DeleteInfo",
        fields: {
            nodesDeleted: "Int!",
            relationshipsDeleted: "Int!",
        },
    });

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
            startCursor: "String!",
            endCursor: "String!",
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
        if (definition.name.value === "PageInfo") {
            throw new Error(
                "Type name `PageInfo` reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information."
            );
        }

        if (definition.name.value.endsWith("Connection")) {
            throw new Error(
                'Type names ending "Connection" are reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.'
            );
        }

        checkNodeImplementsInterfaces(definition, interfaces);

        const otherDirectives = (definition.directives || []).filter(
            (x) => !["auth", "exclude"].includes(x.name.value)
        );
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        let auth: Auth;
        if (authDirective) {
            auth = getAuth(authDirective);
        }

        let exclude: Exclude;
        if (excludeDirective) {
            exclude = parseExcludeDirective(excludeDirective);
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
            description: definition.description?.value,
        });

        return node;
    });

    const relationshipProperties = interfaces.filter((i) => relationshipPropertyInterfaceNames.has(i.name.value));
    interfaces = interfaces.filter((i) => !relationshipPropertyInterfaceNames.has(i.name.value));

    const relationshipFields = new Map<string, RelationshipField[]>();

    relationshipProperties.forEach((relationship) => {
        const relationshipFieldMeta = getRelationshipFieldMeta({ relationship, enums });

        if (!pointInTypeDefs) {
            pointInTypeDefs = relationshipFieldMeta.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = relationshipFieldMeta.some((field) => field.typeMeta.name === "CartesianPoint");
        }

        relationshipFields.set(relationship.name.value, relationshipFieldMeta);

        const propertiesInterface = composer.createInterfaceTC({
            name: relationship.name.value,
            fields: {
                ...relationship.fields?.reduce((res, f) => {
                    const typeMeta = getFieldTypeMeta(f);

                    const newField = {
                        description: f.description?.value,
                        type: typeMeta.pretty,
                    } as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;

                    if (["Int", "Float"].includes(typeMeta.name)) {
                        newField.resolve = (source) => {
                            // @ts-ignore: outputValue is unknown, and to cast to object would be an antipattern
                            if (isInt(source[f.name.value])) {
                                return (source[f.name.value] as Integer).toNumber();
                            }

                            return source[f.name.value];
                        };
                    }

                    return {
                        ...res,
                        [f.name.value]: newField,
                    };
                }, {}),
            },
        });

        composer.createInputTC({
            name: `${relationship.name.value}Sort`,
            fields: propertiesInterface.getFieldNames().reduce((res, f) => {
                return { ...res, [f]: "SortDirection" };
            }, {}),
        });

        composer.createInputTC({
            name: `${relationship.name.value}UpdateInput`,
            fields: relationshipFieldMeta.reduce(
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

        const relationshipWhereFields = getWhereFields({
            typeName: relationship.name.value,
            fields: {
                scalarFields: [],
                enumFields: relationshipFieldMeta.filter(
                    (f) => (f as CustomEnumField).kind === "Enum"
                ) as CustomEnumField[],
                dateTimeFields: relationshipFieldMeta.filter((f) => f.typeMeta.name === "DateTime"),
                pointFields: relationshipFieldMeta.filter((f) => ["Point", "CartesianPoint"].includes(f.typeMeta.name)),
                primitiveFields: relationshipFieldMeta.filter((f) =>
                    ["ID", "String", "Int", "Float"].includes(f.typeMeta.name)
                ),
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
            fields: relationshipFieldMeta.reduce((res, f) => {
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
            ...node.dateTimeFields,
            ...node.pointFields,
            ...node.ignoredFields,
        ]);

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: nodeFields,
            description: node.description,
            extensions: {
                directives: graphqlDirectivesToCompose(node.otherDirectives),
            },
            interfaces: node.interfaces.map((x) => x.name.value),
        });

        const sortFields = [
            ...node.primitiveFields,
            ...node.enumFields,
            ...node.scalarFields,
            ...node.dateTimeFields,
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

        // TODO - use getWhereFields
        const queryFields = {
            OR: `[${node.name}Where!]`,
            AND: `[${node.name}Where!]`,
            // Custom scalar fields only support basic equality
            ...node.scalarFields.reduce((res, f) => {
                res[f.fieldName] = f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name;
                return res;
            }, {}),
            ...[...node.primitiveFields, ...node.dateTimeFields, ...node.enumFields, ...node.pointFields].reduce(
                (res, f) => {
                    res[f.fieldName] = f.typeMeta.input.where.pretty;
                    res[`${f.fieldName}_NOT`] = f.typeMeta.input.where.pretty;

                    if (f.typeMeta.name === "Boolean") {
                        return res;
                    }

                    if (f.typeMeta.array) {
                        res[`${f.fieldName}_INCLUDES`] = f.typeMeta.input.where.type;
                        res[`${f.fieldName}_NOT_INCLUDES`] = f.typeMeta.input.where.type;
                        return res;
                    }

                    res[`${f.fieldName}_IN`] = `[${f.typeMeta.input.where.pretty}]`;
                    res[`${f.fieldName}_NOT_IN`] = `[${f.typeMeta.input.where.pretty}]`;

                    if (["Float", "Int", "BigInt", "DateTime", "Date"].includes(f.typeMeta.name)) {
                        ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                            res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                        });
                        return res;
                    }

                    if (["Point", "CartesianPoint"].includes(f.typeMeta.name)) {
                        ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                            res[`${f.fieldName}${comparator}`] = `${f.typeMeta.name}Distance`;
                        });
                        return res;
                    }

                    if (["String", "ID"].includes(f.typeMeta.name)) {
                        if (enableRegex) {
                            res[`${f.fieldName}_MATCHES`] = "String";
                        }

                        [
                            "_CONTAINS",
                            "_NOT_CONTAINS",
                            "_STARTS_WITH",
                            "_NOT_STARTS_WITH",
                            "_ENDS_WITH",
                            "_NOT_ENDS_WITH",
                        ].forEach((comparator) => {
                            res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                        });
                        return res;
                    }

                    return res;
                },
                {}
            ),
        };

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
                ...node.dateTimeFields.filter((x) => !x.timestamps),
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
                ...node.dateTimeFields.filter((x) => !x.timestamps),
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
                name: `${operation}${pluralize(node.name)}MutationResponse`,
                fields: {
                    [pluralize(camelCase(node.name))]: `[${node.name}!]!`,
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

                refNodes.forEach((n) => {
                    const concatFieldName = `${rel.fieldName}_${n.name}`;
                    const unionPrefix = `${node.name}${upperFirst(rel.fieldName)}${n.name}`;

                    const updateField = `${n.name}UpdateInput`;

                    const nodeFieldInputName = `${unionPrefix}FieldInput`;
                    const nodeFieldUpdateInputName = `${unionPrefix}UpdateFieldInput`;
                    const nodeFieldDeleteInputName = `${unionPrefix}DeleteFieldInput`;
                    const nodeFieldDisconnectInputName = `${unionPrefix}DisconnectFieldInput`;

                    const connectionUpdateInputName = `${unionPrefix}UpdateConnectionInput`;

                    const createName = `${node.name}${upperFirst(rel.fieldName)}${n.name}CreateFieldInput`;
                    const create = rel.typeMeta.array ? `[${createName}!]` : createName;
                    if (!composer.has(createName)) {
                        composer.createInputTC({
                            name: createName,
                            fields: {
                                node: `${n.name}CreateInput!`,
                                ...(rel.properties ? { properties: `${rel.properties}CreateInput!` } : {}),
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
                                ...(rel.properties ? { properties: `${rel.properties}CreateInput!` } : {}),
                            },
                        });
                    }

                    composer.createInputTC({
                        name: connectionUpdateInputName,
                        fields: {
                            ...(rel.properties ? { relationship: `${rel.properties}UpdateInput` } : {}),
                            node: updateField,
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

                    const connectionWhereName = `${unionPrefix}ConnectionWhere`;
                    composer.createInputTC({
                        name: connectionWhereName,
                        fields: {
                            node: `${n.name}Where`,
                            node_NOT: `${n.name}Where`,
                            AND: `[${connectionWhereName}!]`,
                            OR: `[${connectionWhereName}!]`,
                            ...(rel.properties
                                ? {
                                      relationship: `${rel.properties}Where`,
                                      relationship_NOT: `${rel.properties}Where`,
                                  }
                                : {}),
                        },
                    });

                    composer.createInputTC({
                        name: nodeFieldDeleteInputName,
                        fields: {
                            where: connectionWhereName,
                            ...(n.relationFields.length
                                ? {
                                      delete: `${n.name}DeleteInput`,
                                  }
                                : {}),
                        },
                    });

                    composer.createInputTC({
                        name: nodeFieldDisconnectInputName,
                        fields: {
                            where: connectionWhereName,
                            ...(n.relationFields.length
                                ? {
                                      disconnect: `${n.name}DisconnectInput`,
                                  }
                                : {}),
                        },
                    });

                    nodeRelationInput.addFields({
                        [concatFieldName]: create,
                    });

                    nodeInput.addFields({
                        [concatFieldName]: nodeFieldInputName,
                    });

                    nodeUpdateInput.addFields({
                        [concatFieldName]: rel.typeMeta.array
                            ? `[${nodeFieldUpdateInputName}!]`
                            : nodeFieldUpdateInputName,
                    });

                    nodeDeleteInput.addFields({
                        [concatFieldName]: rel.typeMeta.array
                            ? `[${nodeFieldDeleteInputName}!]`
                            : nodeFieldDeleteInputName,
                    });

                    nodeConnectInput.addFields({
                        [concatFieldName]: connect,
                    });

                    nodeDisconnectInput.addFields({
                        [concatFieldName]: rel.typeMeta.array
                            ? `[${nodeFieldDisconnectInputName}!]`
                            : nodeFieldDisconnectInputName,
                    });
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

            whereInput.addFields({
                ...{ [rel.fieldName]: `${n.name}Where`, [`${rel.fieldName}_NOT`]: `${n.name}Where` },
                ...(rel.typeMeta.array
                    ? {}
                    : {
                          [`${rel.fieldName}_IN`]: `[${n.name}Where!]`,
                          [`${rel.fieldName}_NOT_IN`]: `[${n.name}Where!]`,
                      }),
            });

            let anyNonNullRelProperties = false;

            if (rel.properties) {
                const relFields = relationshipFields.get(rel.properties) || [];
                anyNonNullRelProperties = relFields.some((field) => field.typeMeta.required);
            }

            const createName = `${node.name}${upperFirst(rel.fieldName)}CreateFieldInput`;
            const create = rel.typeMeta.array ? `[${createName}!]` : createName;
            if (!composer.has(createName)) {
                composer.createInputTC({
                    name: createName,
                    fields: {
                        node: `${n.name}CreateInput!`,
                        ...(rel.properties
                            ? { properties: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
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
                        ...(rel.properties
                            ? { properties: `${rel.properties}CreateInput${anyNonNullRelProperties ? `!` : ""}` }
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
                    ...(rel.properties ? { relationship: `${rel.properties}UpdateInput` } : {}),
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
                fields: {
                    AND: `[${connectionWhereName}!]`,
                    OR: `[${connectionWhereName}!]`,
                },
            });

            const connection = composer.createObjectTC({
                name: connectionField.typeMeta.name,
                fields: {
                    edges: relationship.NonNull.List.NonNull,
                    totalCount: "Int!",
                    pageInfo: "PageInfo!",
                },
            });

            if (connectionField.relationship.properties) {
                const propertiesInterface = composer.getIFTC(connectionField.relationship.properties);
                relationship.addInterface(propertiesInterface);
                relationship.addFields(propertiesInterface.getFields());

                connectionWhere.addFields({
                    relationship: `${connectionField.relationship.properties}Where`,
                    relationship_NOT: `${connectionField.relationship.properties}Where`,
                });
            }

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
                    connectionWhere.addFields({
                        [n.name]: `${n.name}Where`,
                        [`${n.name}_NOT`]: `${n.name}Where`,
                    });
                });
            } else {
                connectionWhere.addFields({
                    node: `${connectionField.relationship.typeMeta.name}Where`,
                    node_NOT: `${connectionField.relationship.typeMeta.name}Where`,
                });

                const connectionSort = composer.createInputTC({
                    name: `${connectionField.typeMeta.name}Sort`,
                    fields: {
                        node: `${connectionField.relationship.typeMeta.name}Sort`,
                    },
                });

                if (connectionField.relationship.properties) {
                    connectionSort.addFields({
                        relationship: `${connectionField.relationship.properties}Sort`,
                    });
                }

                composeNodeArgs = {
                    ...composeNodeArgs,
                    sort: connectionSort.NonNull.List,
                    first: {
                        type: "Int",
                    },
                    after: {
                        type: "String",
                    },
                };
            }

            composeNode.addFields({
                [connectionField.fieldName]: {
                    type: connection.NonNull,
                    args: composeNodeArgs,
                    resolve: (source, args: ConnectionQueryArgs) => {
                        const { totalCount: count, edges } = source[connectionField.fieldName];

                        const totalCount = isInt(count) ? count.toNumber() : count;

                        return {
                            totalCount,
                            ...createConnectionWithEdgeProperties(edges, args, totalCount),
                        };
                    },
                },
            });

            const r = new Relationship({
                name: connectionField.relationshipTypeName,
                type: connectionField.relationship.type,
                fields: connectionField.relationship.properties
                    ? (relationshipFields.get(connectionField.relationship.properties) as RelationshipField[])
                    : [],
                properties: connectionField.relationship.properties,
            });
            relationships.push(r);
        });

        if (!node.exclude?.operations.includes("read")) {
            composer.Query.addFields({
                [pluralize(camelCase(node.name))]: findResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("create")) {
            composer.Mutation.addFields({
                [`create${pluralize(node.name)}`]: createResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("delete")) {
            composer.Mutation.addFields({
                [`delete${pluralize(node.name)}`]: deleteResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("update")) {
            composer.Mutation.addFields({
                [`update${pluralize(node.name)}`]: updateResolver({ node }),
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
                ...objectFields.dateTimeFields,
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
            extensions: {
                directives: graphqlDirectivesToCompose((inter.directives || []).filter((x) => x.name.value !== "auth")),
            },
        });
    });

    if (!Object.values(composer.Mutation.getFields()).length) {
        composer.delete("Mutation");
    }
    const generatedTypeDefs = composer.toSDL();
    const generatedResolvers = {
        ...composer.getResolveMethods(),
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

    const schema = makeExecutableSchema({
        ...schemaDefinition,
        typeDefs: generatedTypeDefs,
        resolvers: generatedResolvers,
    });

    return {
        nodes,
        relationships,
        schema,
    };
}

export default makeAugmentedSchema;
