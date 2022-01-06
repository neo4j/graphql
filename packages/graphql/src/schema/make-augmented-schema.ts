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
    DirectiveNode,
    EnumTypeDefinitionNode,
    GraphQLInt,
    GraphQLNonNull,
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
    InputTypeComposer,
    InputTypeComposerFieldConfigAsObjectDefinition,
    ObjectTypeComposer,
    SchemaComposer,
    upperFirst,
} from "graphql-compose";
import { Exclude, Node } from "../classes";
import { NodeDirective } from "../classes/NodeDirective";
import Relationship from "../classes/Relationship";
import * as constants from "../constants";
import { Auth, FullText, PrimitiveField } from "../types";
import { isString } from "../utils/utils";
import createConnectionFields from "./create-connection-fields";
import createRelationshipFields from "./create-relationship-fields";
import getAuth from "./get-auth";
import getCustomResolvers from "./get-custom-resolvers";
import getObjFieldMeta, { ObjectFields } from "./get-obj-field-meta";
import getWhereFields from "./get-where-fields";
import parseExcludeDirective from "./parse-exclude-directive";
import parseNodeDirective from "./parse-node-directive";
import parseFulltextDirective from "./parse/parse-fulltext-directive";
import * as point from "./point";
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
} from "./resolvers";
import * as Scalars from "./scalars";
import { graphqlDirectivesToCompose, objectFieldsToComposeFields } from "./to-compose";
import { validateDocument } from "./validation";
import getUniqueFields from "./get-unique-fields";
import { AggregationTypesMapper } from "./aggregations/aggregation-types-mapper";

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

    let relationships: Relationship[] = [];

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

    const aggregationTypesMapper = new AggregationTypesMapper(composer);

    composer.createInputTC({
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
    const interfaceRelationshipNames = new Set<string>();

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

    Object.keys(Scalars).forEach((scalar) => composer.addTypeDefs(`scalar ${scalar}`));

    if (extraDefinitions.length) {
        composer.addTypeDefs(print({ kind: "Document", definitions: extraDefinitions }));
    }

    const nodes = objectNodes.map((definition) => {
        const otherDirectives = (definition.directives || []).filter(
            (x) => !["auth", "exclude", "node", "fulltext"].includes(x.name.value)
        );
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "node");
        const fulltextDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "fulltext");
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        const { interfaceAuthDirectives, interfaceExcludeDirectives } = nodeInterfaces.reduce<{
            interfaceAuthDirectives: DirectiveNode[];
            interfaceExcludeDirectives: DirectiveNode[];
        }>(
            (res, interfaceName) => {
                const iface = interfaces.find((i) => i.name.value === interfaceName.name.value);

                if (iface) {
                    const interfaceAuthDirective = (iface.directives || []).find((x) => x.name.value === "auth");
                    const interfaceExcludeDirective = (iface.directives || []).find((x) => x.name.value === "exclude");

                    if (interfaceAuthDirective) {
                        res.interfaceAuthDirectives.push(interfaceAuthDirective);
                    }

                    if (interfaceExcludeDirective) {
                        res.interfaceExcludeDirectives.push(interfaceExcludeDirective);
                    }
                }

                return res;
            },
            { interfaceAuthDirectives: [], interfaceExcludeDirectives: [] }
        );

        if (interfaceAuthDirectives.length > 1) {
            throw new Error(
                `Multiple interfaces of ${definition.name.value} have @auth directive - cannot determine directive to use`
            );
        }

        if (interfaceExcludeDirectives.length > 1) {
            throw new Error(
                `Multiple interfaces of ${definition.name.value} have @exclude directive - cannot determine directive to use`
            );
        }

        let auth: Auth;
        if (authDirective || interfaceAuthDirectives.length) {
            auth = getAuth(authDirective || interfaceAuthDirectives[0]);
        }

        let exclude: Exclude;
        if (excludeDirective || interfaceExcludeDirectives.length) {
            exclude = parseExcludeDirective(excludeDirective || interfaceExcludeDirectives[0]);
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

        let fulltextDirective: FullText;
        if (fulltextDirectiveDefinition) {
            fulltextDirective = parseFulltextDirective({
                directive: fulltextDirectiveDefinition,
                nodeFields,
                definition,
            });
        }

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
            if (relationship.interface) {
                interfaceRelationshipNames.add(relationship.typeMeta.name);
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
            // @ts-ignore we can be sure it's defined
            fulltextDirective,
            description: definition.description?.value,
        });

        return node;
    });

    const relationshipProperties = interfaces.filter((i) => relationshipPropertyInterfaceNames.has(i.name.value));
    const interfaceRelationships = interfaces.filter((i) => interfaceRelationshipNames.has(i.name.value));
    interfaces = interfaces.filter(
        (i) => !(relationshipPropertyInterfaceNames.has(i.name.value) || interfaceRelationshipNames.has(i.name.value))
    );

    const relationshipFields = new Map<string, ObjectFields>();

    relationshipProperties.forEach((relationship) => {
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
            enableRegex,
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

    function ensureNonEmptyInput(nameOrInput: string | InputTypeComposer<any>) {
        const input = isString(nameOrInput) ? composer.getITC(nameOrInput) : nameOrInput;

        if (input.getFieldNames().length === 0) {
            const faqURL = `https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/`;
            input.addFields({
                _emptyInput: {
                    type: "Boolean",
                    description:
                        `Appears because this input type would be empty otherwise because this type is ` +
                        `composed of just generated and/or relationship properties. See ${faqURL}`,
                },
            });
        }
    }

    interfaceRelationships.forEach((interfaceRelationship) => {
        const implementations = objectNodes.filter((n) =>
            n.interfaces?.some((i) => i.name.value === interfaceRelationship.name.value)
        );

        const interfaceFields = getObjFieldMeta({
            enums,
            interfaces: [...interfaces, ...interfaceRelationships],
            objects: objectNodes,
            scalars,
            unions,
            obj: interfaceRelationship,
        });

        if (!pointInTypeDefs) {
            pointInTypeDefs = interfaceFields.pointFields.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = interfaceFields.pointFields.some(
                (field) => field.typeMeta.name === "CartesianPoint"
            );
        }

        const objectComposeFields = objectFieldsToComposeFields(
            Object.values(interfaceFields).reduce((acc, x) => [...acc, ...x], [])
        );

        const composeInterface = composer.createInterfaceTC({
            name: interfaceRelationship.name.value,
            fields: objectComposeFields,
        });

        const interfaceWhereFields = getWhereFields({
            typeName: interfaceRelationship.name.value,
            fields: {
                scalarFields: interfaceFields.scalarFields,
                enumFields: interfaceFields.enumFields,
                temporalFields: interfaceFields.temporalFields,
                pointFields: interfaceFields.pointFields,
                primitiveFields: interfaceFields.primitiveFields,
            },
            enableRegex,
            isInterface: true,
        });

        const [
            implementationsConnectInput,
            implementationsDeleteInput,
            implementationsDisconnectInput,
            implementationsUpdateInput,
            implementationsWhereInput,
        ] = ["ConnectInput", "DeleteInput", "DisconnectInput", "UpdateInput", "Where"].map((suffix) =>
            composer.createInputTC({
                name: `${interfaceRelationship.name.value}Implementations${suffix}`,
                fields: {},
            })
        );

        composer.createInputTC({
            name: `${interfaceRelationship.name.value}Where`,
            fields: { ...interfaceWhereFields, _on: implementationsWhereInput },
        });

        const interfaceCreateInput = composer.createInputTC(`${interfaceRelationship.name.value}CreateInput`);

        composer.getOrCreateITC(`${interfaceRelationship.name.value}UpdateInput`, (tc) => {
            tc.addFields({
                ...[
                    ...interfaceFields.primitiveFields,
                    ...interfaceFields.scalarFields,
                    ...interfaceFields.enumFields,
                    ...interfaceFields.temporalFields.filter((field) => !field.timestamps),
                    ...interfaceFields.pointFields,
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
                _on: implementationsUpdateInput,
            });
        });

        createRelationshipFields({
            relationshipFields: interfaceFields.relationFields,
            schemaComposer: composer,
            composeNode: composeInterface,
            sourceName: interfaceRelationship.name.value,
            nodes,
            relationshipPropertyFields: relationshipFields,
        });

        relationships = [
            ...relationships,
            ...createConnectionFields({
                connectionFields: interfaceFields.connectionFields,
                schemaComposer: composer,
                composeNode: composeInterface,
                nodes,
                relationshipPropertyFields: relationshipFields,
            }),
        ];

        implementations.forEach((implementation) => {
            const node = nodes.find((n) => n.name === implementation.name.value) as Node;

            implementationsWhereInput.addFields({
                [implementation.name.value]: {
                    type: `${implementation.name.value}Where`,
                },
            });

            if (node.relationFields.length) {
                implementationsConnectInput.addFields({
                    [implementation.name.value]: {
                        type: `[${implementation.name.value}ConnectInput!]`,
                    },
                });

                implementationsDeleteInput.addFields({
                    [implementation.name.value]: {
                        type: `[${implementation.name.value}DeleteInput!]`,
                    },
                });

                implementationsDisconnectInput.addFields({
                    [implementation.name.value]: {
                        type: `[${implementation.name.value}DisconnectInput!]`,
                    },
                });
            }

            interfaceCreateInput.addFields({
                [implementation.name.value]: {
                    type: `${implementation.name.value}CreateInput`,
                },
            });

            implementationsUpdateInput.addFields({
                [implementation.name.value]: {
                    type: `${implementation.name.value}UpdateInput`,
                },
            });
        });

        if (implementationsConnectInput.getFieldNames().length) {
            const interfaceConnectInput = composer.getOrCreateITC(
                `${interfaceRelationship.name.value}ConnectInput`,
                (tc) => {
                    tc.addFields({ _on: implementationsConnectInput });
                }
            );
            interfaceConnectInput.setField("_on", implementationsConnectInput);
        }

        if (implementationsDeleteInput.getFieldNames().length) {
            const interfaceDeleteInput = composer.getOrCreateITC(
                `${interfaceRelationship.name.value}DeleteInput`,
                (tc) => {
                    tc.addFields({ _on: implementationsDeleteInput });
                }
            );
            interfaceDeleteInput.setField("_on", implementationsDeleteInput);
        }

        if (implementationsDisconnectInput.getFieldNames().length) {
            const interfaceDisconnectInput = composer.getOrCreateITC(
                `${interfaceRelationship.name.value}DisconnectInput`,
                (tc) => {
                    tc.addFields({ _on: implementationsDisconnectInput });
                }
            );
            interfaceDisconnectInput.setField("_on", implementationsDisconnectInput);
        }

        ensureNonEmptyInput(`${interfaceRelationship.name.value}CreateInput`);
        ensureNonEmptyInput(`${interfaceRelationship.name.value}UpdateInput`);
        [
            implementationsConnectInput,
            implementationsDeleteInput,
            implementationsDisconnectInput,
            implementationsUpdateInput,
            implementationsWhereInput,
        ].forEach((c) => ensureNonEmptyInput(c));
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
                return { ...f, [type.name.value]: `${type.name.value}Where` };
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

        const sortFields = node.sortableFields.reduce(
            (res, f) => ({
                ...res,
                [f.fieldName]: sortDirection.getTypeName(),
            }),
            {}
        );

        if (Object.keys(sortFields).length) {
            const sortInput = composer.createInputTC({
                name: `${node.name}Sort`,
                fields: sortFields,
                description: `Fields to sort ${node.getPlural({
                    pascalCase: true,
                })} by. The order in which sorts are applied is not guaranteed when specifying many fields in one ${`${node.name}Sort`} object.`,
            });

            composer.createInputTC({
                name: `${node.name}Options`,
                fields: {
                    sort: {
                        description: `Specify one or more ${`${node.name}Sort`} objects to sort ${node.getPlural({
                            pascalCase: true,
                        })} by. The sorts will be applied in the order in which they are arranged in the array.`,
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

        const countField = {
            type: "Int!",
            resolve: numericalResolver,
            args: {},
        };

        composer.createObjectTC({
            name: `${node.name}AggregateSelection`,
            fields: {
                count: countField,
                ...[...node.primitiveFields, ...node.temporalFields].reduce((res, field) => {
                    if (field.typeMeta.array) {
                        return res;
                    }
                    const objectTypeComposer = aggregationTypesMapper.getAggregationType({
                        fieldName: field.typeMeta.name,
                        nullable: !field.typeMeta.required,
                    });

                    if (!objectTypeComposer) return res;

                    res[field.fieldName] = objectTypeComposer.NonNull;

                    return res;
                }, {}),
            },
        });

        composer.createInputTC({
            name: `${node.name}Where`,
            fields: queryFields,
        });

        if (node.fulltextDirective) {
            const fields = node.fulltextDirective.indexes.reduce((res, index) => {
                return {
                    ...res,
                    [index.name]: composer.createInputTC({
                        name: `${node.name}${upperFirst(index.name)}Fulltext`,
                        fields: {
                            phrase: "String!",
                            score_EQUAL: "Int",
                        },
                    }),
                };
            }, {});

            composer.createInputTC({
                name: `${node.name}Fulltext`,
                fields,
            });
        }

        const uniqueFields = getUniqueFields(node);

        composer.createInputTC({
            name: `${node.name}UniqueWhere`,
            fields: uniqueFields,
        });

        composer.createInputTC({
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

        composer.createInputTC({
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

        ["Create", "Update"].map((operation) =>
            composer.createObjectTC({
                name: `${operation}${node.getPlural({ pascalCase: true })}MutationResponse`,
                fields: {
                    info: `${operation}Info!`,
                    [node.getPlural({})]: `[${node.name}!]!`,
                },
            })
        );

        createRelationshipFields({
            relationshipFields: node.relationFields,
            schemaComposer: composer,
            composeNode,
            sourceName: node.name,
            nodes,
            relationshipPropertyFields: relationshipFields,
        });

        relationships = [
            ...relationships,
            ...createConnectionFields({
                connectionFields: node.connectionFields,
                schemaComposer: composer,
                composeNode,
                nodes,
                relationshipPropertyFields: relationshipFields,
            }),
        ];

        ensureNonEmptyInput(`${node.name}UpdateInput`);
        ensureNonEmptyInput(`${node.name}CreateInput`);

        if (!node.exclude?.operations.includes("read")) {
            composer.Query.addFields({
                [node.getPlural({})]: findResolver({ node }),
            });

            composer.Query.addFields({
                [`${node.getPlural({})}Count`]: countResolver({ node }),
            });

            composer.Query.addFields({
                [`${node.getPlural({})}Aggregate`]: aggregateResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("create")) {
            composer.Mutation.addFields({
                [`create${node.getPlural({ pascalCase: true })}`]: createResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("delete")) {
            composer.Mutation.addFields({
                [`delete${node.getPlural({ pascalCase: true })}`]: deleteResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("update")) {
            composer.Mutation.addFields({
                [`update${node.getPlural({ pascalCase: true })}`]: updateResolver({
                    node,
                    schemaComposer: composer,
                }),
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
            directives: graphqlDirectivesToCompose(
                (inter.directives || []).filter((x) => !["auth", "exclude"].includes(x.name.value))
            ),
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

    interfaceRelationships.forEach((i) => {
        if (!generatedResolvers[i.name.value]) {
            // eslint-disable-next-line no-underscore-dangle
            generatedResolvers[i.name.value] = { __resolveType: (root) => root.__resolveType };
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
