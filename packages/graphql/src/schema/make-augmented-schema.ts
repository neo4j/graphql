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

import type { IResolvers, TypeSource } from "@graphql-tools/utils";
import type {
    DefinitionNode,
    DocumentNode,
    GraphQLScalarType,
    InterfaceTypeDefinitionNode,
    NameNode,
    ObjectTypeDefinitionNode,
} from "graphql";
import { GraphQLID, GraphQLNonNull, Kind, parse, print } from "graphql";
import type { ObjectTypeComposer } from "graphql-compose";
import { SchemaComposer } from "graphql-compose";
import pluralize from "pluralize";
import { validateDocument } from "./validation";
import type { BaseField, Neo4jGraphQLCallbacks, Neo4jFeaturesSettings } from "../types";
import { cypherResolver } from "./resolvers/field/cypher";
import { numericalResolver } from "./resolvers/field/numerical";
import { aggregateResolver } from "./resolvers/query/aggregate";
import { findResolver } from "./resolvers/query/read";
import { rootConnectionResolver } from "./resolvers/query/root-connection";
import { createResolver } from "./resolvers/mutation/create";
import { deleteResolver } from "./resolvers/mutation/delete";
import { updateResolver } from "./resolvers/mutation/update";
import { AggregationTypesMapper } from "./aggregations/aggregation-types-mapper";
import { augmentFulltextSchema } from "./augment/fulltext";
import * as constants from "../constants";
import * as Scalars from "../graphql/scalars";
import type { Node } from "../classes";
import type Relationship from "../classes/Relationship";
import createConnectionFields from "./create-connection-fields";
import createRelationshipFields from "./create-relationship-fields";
import getCustomResolvers from "./get-custom-resolvers";
import type { ObjectFields } from "./get-obj-field-meta";
import getObjFieldMeta from "./get-obj-field-meta";
import getSortableFields from "./get-sortable-fields";
import {
    graphqlDirectivesToCompose,
    objectFieldsToComposeFields,
    objectFieldsToCreateInputFields,
    objectFieldsToUpdateInputFields,
} from "./to-compose";
import getUniqueFields from "./get-unique-fields";
import getWhereFields from "./get-where-fields";
import { upperFirst } from "../utils/upper-first";
import { ensureNonEmptyInput } from "./ensure-non-empty-input";
import { getDocument } from "./get-document";
import { getDefinitionNodes } from "./get-definition-nodes";
import { isRootType } from "../utils/is-root-type";

// GraphQL type imports
import { CreateInfo } from "../graphql/objects/CreateInfo";
import { DeleteInfo } from "../graphql/objects/DeleteInfo";
import { UpdateInfo } from "../graphql/objects/UpdateInfo";
import { PageInfo } from "../graphql/objects/PageInfo";
import { SortDirection } from "../graphql/enums/SortDirection";
import { QueryOptions } from "../graphql/input-objects/QueryOptions";
import { Point } from "../graphql/objects/Point";
import { CartesianPoint } from "../graphql/objects/CartesianPoint";
import { PointInput } from "../graphql/input-objects/PointInput";
import { CartesianPointInput } from "../graphql/input-objects/CartesianPointInput";
import { PointDistance } from "../graphql/input-objects/PointDistance";
import { CartesianPointDistance } from "../graphql/input-objects/CartesianPointDistance";
import getNodes from "./get-nodes";
import { generateSubscriptionTypes } from "./subscriptions/generate-subscription-types";
import { getResolveAndSubscriptionMethods } from "./get-resolve-and-subscription-methods";
import { addGlobalNodeFields } from "./create-global-nodes";
import { addMathOperatorsToITC } from "./math";
import { addArrayMethodsToITC } from "./array-methods";
import { FloatWhere } from "../graphql/input-objects/FloatWhere";

function makeAugmentedSchema(
    typeDefs: TypeSource,
    {
        features,
        enableRegex,
        skipValidateTypeDefs,
        generateSubscriptions,
        callbacks,
        userCustomResolvers,
    }: {
        features?: Neo4jFeaturesSettings;
        enableRegex?: boolean;
        skipValidateTypeDefs?: boolean;
        generateSubscriptions?: boolean;
        callbacks?: Neo4jGraphQLCallbacks;
        userCustomResolvers?: IResolvers | Array<IResolvers>;
    } = {}
): { nodes: Node[]; relationships: Relationship[]; typeDefs: DocumentNode; resolvers: IResolvers } {
    const document = getDocument(typeDefs);

    if (!skipValidateTypeDefs) {
        validateDocument(document);
    }

    const composer = new SchemaComposer();

    let relationships: Relationship[] = [];

    composer.createObjectTC(CreateInfo);
    composer.createObjectTC(DeleteInfo);
    composer.createObjectTC(UpdateInfo);
    composer.createObjectTC(PageInfo);
    composer.createInputTC(QueryOptions);
    const sortDirection = composer.createEnumTC(SortDirection);

    const aggregationTypesMapper = new AggregationTypesMapper(composer);

    const customResolvers = getCustomResolvers(document);

    const definitionNodes = getDefinitionNodes(document);

    const { scalarTypes, objectTypes, enumTypes, inputObjectTypes, directives, unionTypes } = definitionNodes;

    let { interfaceTypes } = definitionNodes;

    const extraDefinitions = [
        ...enumTypes,
        ...scalarTypes,
        ...directives,
        ...inputObjectTypes,
        ...unionTypes,
        ...([
            customResolvers.customQuery,
            customResolvers.customMutation,
            customResolvers.customSubscription,
        ] as ObjectTypeDefinitionNode[]),
    ].filter(Boolean) as DefinitionNode[];

    Object.values(Scalars).forEach((scalar: GraphQLScalarType) => composer.addTypeDefs(`scalar ${scalar.name}`));

    if (extraDefinitions.length) {
        composer.addTypeDefs(print({ kind: Kind.DOCUMENT, definitions: extraDefinitions }));
    }

    const getNodesResult = getNodes(definitionNodes, { callbacks, userCustomResolvers });

    const { nodes, relationshipPropertyInterfaceNames, interfaceRelationshipNames, floatWhereInTypeDefs } = getNodesResult;

    // graphql-compose will break if the Point and CartesianPoint types are created but not used,
    // because it will purge the unused types but leave behind orphaned field resolvers
    //
    // These are flags to check whether the types are used and then create them if they are
    let { pointInTypeDefs, cartesianPointInTypeDefs } = getNodesResult;

    const hasGlobalNodes = addGlobalNodeFields(nodes, composer);

    const relationshipProperties = interfaceTypes.filter((i) => relationshipPropertyInterfaceNames.has(i.name.value));
    const interfaceRelationships = interfaceTypes.filter((i) => interfaceRelationshipNames.has(i.name.value));
    interfaceTypes = interfaceTypes.filter(
        (i) => !(relationshipPropertyInterfaceNames.has(i.name.value) || interfaceRelationshipNames.has(i.name.value))
    );

    const relationshipFields = new Map<string, ObjectFields>();
    const interfaceCommonFields = new Map<string, ObjectFields>();

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
            enums: enumTypes,
            interfaces: interfaceTypes,
            objects: objectTypes,
            scalars: scalarTypes,
            unions: unionTypes,
            obj: relationship,
            callbacks,
        });

        if (!pointInTypeDefs) {
            pointInTypeDefs = relFields.pointFields.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = relFields.pointFields.some((field) => field.typeMeta.name === "CartesianPoint");
        }

        relationshipFields.set(relationship.name.value, relFields);

        const baseFields: BaseField[][] = Object.values(relFields);

        const objectComposeFields = objectFieldsToComposeFields(baseFields.reduce((acc, x) => [...acc, ...x], []));

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

        const relationshipUpdateITC = composer.createInputTC({
            name: `${relationship.name.value}UpdateInput`,
            fields: objectFieldsToUpdateInputFields([
                ...relFields.primitiveFields.filter(
                    (field) => !field.autogenerate && !field.readonly && !field.callback
                ),
                ...relFields.scalarFields,
                ...relFields.enumFields,
                ...relFields.temporalFields.filter((field) => !field.timestamps),
                ...relFields.pointFields,
            ]),
        });

        addMathOperatorsToITC(relationshipUpdateITC);

        addArrayMethodsToITC(relationshipUpdateITC, relFields.primitiveFields);
        addArrayMethodsToITC(relationshipUpdateITC, relFields.pointFields);

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
            features,
        });

        composer.createInputTC({
            name: `${relationship.name.value}Where`,
            fields: relationshipWhereFields,
        });

        composer.createInputTC({
            name: `${relationship.name.value}CreateInput`,
            fields: objectFieldsToCreateInputFields([
                ...relFields.primitiveFields.filter((field) => !field.autogenerate && !field.callback),
                ...relFields.scalarFields,
                ...relFields.enumFields,
                ...relFields.temporalFields,
                ...relFields.pointFields,
            ]),
        });
    });

    interfaceRelationships.forEach((interfaceRelationship) => {
        const implementations = objectTypes.filter((n) =>
            n.interfaces?.some((i) => i.name.value === interfaceRelationship.name.value)
        );

        const interfaceFields = getObjFieldMeta({
            enums: enumTypes,
            interfaces: [...interfaceTypes, ...interfaceRelationships],
            objects: objectTypes,
            scalars: scalarTypes,
            unions: unionTypes,
            obj: interfaceRelationship,
            callbacks,
        });

        if (!pointInTypeDefs) {
            pointInTypeDefs = interfaceFields.pointFields.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = interfaceFields.pointFields.some(
                (field) => field.typeMeta.name === "CartesianPoint"
            );
        }

        const baseFields: BaseField[][] = Object.values(interfaceFields);
        const objectComposeFields = objectFieldsToComposeFields(baseFields.reduce((acc, x) => [...acc, ...x], []));

        const composeInterface = composer.createInterfaceTC({
            name: interfaceRelationship.name.value,
            fields: objectComposeFields,
        });

        interfaceCommonFields.set(interfaceRelationship.name.value, interfaceFields);

        const interfaceOptionsInput = composer.getOrCreateITC(`${interfaceRelationship.name.value}Options`, (tc) => {
            tc.addFields({
                limit: "Int",
                offset: "Int",
            });
        });

        const interfaceSortableFields = getSortableFields(interfaceFields).reduce(
            (res, f) => ({
                ...res,
                [f.fieldName]: sortDirection.getTypeName(),
            }),
            {}
        );

        if (Object.keys(interfaceSortableFields).length) {
            const interfaceSortInput = composer.getOrCreateITC(`${interfaceRelationship.name.value}Sort`, (tc) => {
                tc.addFields(interfaceSortableFields);
                tc.setDescription(
                    `Fields to sort ${pluralize(
                        interfaceRelationship.name.value
                    )} by. The order in which sorts are applied is not guaranteed when specifying many fields in one ${`${interfaceRelationship.name.value}Sort`} object.`
                );
            });

            interfaceOptionsInput.addFields({
                sort: {
                    description: `Specify one or more ${`${interfaceRelationship.name.value}Sort`} objects to sort ${pluralize(
                        interfaceRelationship.name.value
                    )} by. The sorts will be applied in the order in which they are arranged in the array.`,
                    type: interfaceSortInput.List,
                },
            });
        }

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
            features,
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

        const interfaceRelationshipITC = composer.getOrCreateITC(
            `${interfaceRelationship.name.value}UpdateInput`,
            (tc) => {
                tc.addFields({
                    ...objectFieldsToUpdateInputFields([
                        ...interfaceFields.primitiveFields,
                        ...interfaceFields.scalarFields,
                        ...interfaceFields.enumFields,
                        ...interfaceFields.temporalFields.filter((field) => !field.timestamps),
                        ...interfaceFields.pointFields,
                    ]),
                    _on: implementationsUpdateInput,
                });
            }
        );

        addMathOperatorsToITC(interfaceRelationshipITC);

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

        ensureNonEmptyInput(composer, `${interfaceRelationship.name.value}CreateInput`);
        ensureNonEmptyInput(composer, `${interfaceRelationship.name.value}UpdateInput`);
        [
            implementationsConnectInput,
            implementationsDeleteInput,
            implementationsDisconnectInput,
            implementationsUpdateInput,
            implementationsWhereInput,
        ].forEach((c) => ensureNonEmptyInput(composer, c));
    });

    if (pointInTypeDefs) {
        // Every field (apart from CRS) in Point needs a custom resolver
        // to deconstruct the point objects we fetch from the database
        composer.createObjectTC(Point);
        composer.createInputTC(PointInput);
        composer.createInputTC(PointDistance);
    }

    if (cartesianPointInTypeDefs) {
        // Every field (apart from CRS) in CartesianPoint needs a custom resolver
        // to deconstruct the point objects we fetch from the database
        composer.createObjectTC(CartesianPoint);
        composer.createInputTC(CartesianPointInput);
        composer.createInputTC(CartesianPointDistance);
    }

    if (floatWhereInTypeDefs) {
        composer.createInputTC(FloatWhere);
    }

    unionTypes.forEach((union) => {
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
            ...node.customResolverFields,
        ]);

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: nodeFields,
            description: node.description,
            directives: graphqlDirectivesToCompose(node.otherDirectives),
            interfaces: node.interfaces.map((x) => x.name.value),
        });

        if (node.isGlobalNode) {
            composeNode.setField("id", {
                type: new GraphQLNonNull(GraphQLID),
                resolve: (src) => {
                    const field = node.getGlobalIdField();
                    const value = src[field] as string | number;
                    return node.toGlobalId(value.toString());
                },
            });

            composeNode.addInterface("Node");
        }

        const sortFields = getSortableFields(node).reduce(
            (res, f) => ({
                ...res,
                [f.fieldName]: sortDirection.getTypeName(),
            }),
            {}
        );

        const nodeSortTypeName = `${node.name}Sort`;
        if (Object.keys(sortFields).length) {
            const sortInput = composer.createInputTC({
                name: nodeSortTypeName,
                fields: sortFields,
                description: `Fields to sort ${upperFirst(
                    node.plural
                )} by. The order in which sorts are applied is not guaranteed when specifying many fields in one ${nodeSortTypeName} object.`,
            });

            composer.createInputTC({
                name: `${node.name}Options`,
                fields: {
                    sort: {
                        description: `Specify one or more ${nodeSortTypeName} objects to sort ${upperFirst(
                            node.plural
                        )} by. The sorts will be applied in the order in which they are arranged in the array.`,
                        type: sortInput.NonNull.List,
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
            features,
        });

        const countField = {
            type: "Int!",
            resolve: numericalResolver,
            args: {},
        };

        composer.createObjectTC({
            name: node.aggregateTypeNames.selection,
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

        const nodeWhereTypeName = `${node.name}Where`;
        composer.createInputTC({
            name: nodeWhereTypeName,
            fields: node.isGlobalNode ? { id: "ID", ...queryFields } : queryFields,
        });

        augmentFulltextSchema(node, composer, nodeWhereTypeName, nodeSortTypeName);

        const uniqueFields = getUniqueFields(node);

        composer.createInputTC({
            name: `${node.name}UniqueWhere`,
            fields: uniqueFields,
        });

        composer.createInputTC({
            name: `${node.name}CreateInput`,
            fields: objectFieldsToCreateInputFields([
                ...node.primitiveFields.filter((field) => !field.callback),
                ...node.scalarFields,
                ...node.enumFields,
                ...node.temporalFields,
                ...node.pointFields,
            ]),
        });

        const nodeUpdateITC = composer.createInputTC({
            name: `${node.name}UpdateInput`,
            fields: objectFieldsToUpdateInputFields([
                ...node.primitiveFields.filter((field) => !field.callback),
                ...node.scalarFields,
                ...node.enumFields,
                ...node.temporalFields.filter((field) => !field.timestamps),
                ...node.pointFields,
            ]),
        });

        addMathOperatorsToITC(nodeUpdateITC);

        addArrayMethodsToITC(nodeUpdateITC, node.mutableFields);

        const mutationResponseTypeNames = node.mutationResponseTypeNames;

        composer.createObjectTC({
            name: mutationResponseTypeNames.create,
            fields: {
                info: `CreateInfo!`,
                [node.plural]: `[${node.name}!]!`,
            },
        });

        composer.createObjectTC({
            name: mutationResponseTypeNames.update,
            fields: {
                info: `UpdateInfo!`,
                [node.plural]: `[${node.name}!]!`,
            },
        });

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

        ensureNonEmptyInput(composer, `${node.name}UpdateInput`);
        ensureNonEmptyInput(composer, `${node.name}CreateInput`);

        const rootTypeFieldNames = node.rootTypeFieldNames;

        if (!node.exclude?.operations.includes("read")) {
            composer.Query.addFields({
                [rootTypeFieldNames.read]: findResolver({ node }),
            });

            composer.Query.addFields({
                [rootTypeFieldNames.aggregate]: aggregateResolver({ node }),
            });

            composer.Query.addFields({
                [`${node.plural}Connection`]: rootConnectionResolver({ node, composer }),
            });
        }

        if (!node.exclude?.operations.includes("create")) {
            composer.Mutation.addFields({
                [rootTypeFieldNames.create]: createResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("delete")) {
            composer.Mutation.addFields({
                [rootTypeFieldNames.delete]: deleteResolver({ node }),
            });
        }

        if (!node.exclude?.operations.includes("update")) {
            composer.Mutation.addFields({
                [rootTypeFieldNames.update]: updateResolver({
                    node,
                    schemaComposer: composer,
                }),
            });
        }
    });

    if (generateSubscriptions) {
        generateSubscriptionTypes({ schemaComposer: composer, nodes, relationshipFields, interfaceCommonFields });
    }

    ["Mutation", "Query"].forEach((type) => {
        const objectComposer = composer[type] as ObjectTypeComposer;
        const cypherType = customResolvers[`customCypher${type}`] as ObjectTypeDefinitionNode;

        if (cypherType) {
            const objectFields = getObjFieldMeta({
                obj: cypherType,
                scalars: scalarTypes,
                enums: enumTypes,
                interfaces: interfaceTypes,
                unions: unionTypes,
                objects: objectTypes,
                callbacks,
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

    interfaceTypes.forEach((inter) => {
        const objectFields = getObjFieldMeta({
            obj: inter,
            scalars: scalarTypes,
            enums: enumTypes,
            interfaces: interfaceTypes,
            unions: unionTypes,
            objects: objectTypes,
            callbacks,
        });

        const baseFields: BaseField[][] = Object.values(objectFields);
        const objectComposeFields = objectFieldsToComposeFields(baseFields.reduce((acc, x) => [...acc, ...x], []));

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

    function definionNodeHasName(x: DefinitionNode): x is DefinitionNode & { name: NameNode } {
        return "name" in x;
    }

    const emptyObjectsInterfaces = (
        parsedDoc.definitions.filter(
            (x) => (x.kind === "ObjectTypeDefinition" && !isRootType(x)) || x.kind === "InterfaceTypeDefinition"
        ) as (InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode)[]
    ).filter((x) => !x.fields?.length);

    if (emptyObjectsInterfaces.length) {
        throw new Error(
            `Objects and Interfaces must have one or more fields: ${emptyObjectsInterfaces
                .map((x) => x.name.value)
                .join(", ")}`
        );
    }

    const documentNames = parsedDoc.definitions.filter(definionNodeHasName).map((x) => x.name.value);

    const resolveMethods = getResolveAndSubscriptionMethods(composer);
    const generatedResolvers = {
        ...Object.entries(resolveMethods).reduce((res, [key, value]) => {
            if (!documentNames.includes(key)) {
                return res;
            }

            return { ...res, [key]: value };
        }, {}),
        ...Object.values(Scalars).reduce((res, scalar: GraphQLScalarType) => {
            if (generatedTypeDefs.includes(`scalar ${scalar.name}\n`)) {
                res[scalar.name] = scalar;
            }
            return res;
        }, {}),
        ...(hasGlobalNodes ? { Node: { __resolveType: (root) => root.__resolveType } } : {}),
    };

    unionTypes.forEach((union) => {
        if (!generatedResolvers[union.name.value]) {
            generatedResolvers[union.name.value] = { __resolveType: (root) => root.__resolveType };
        }
    });

    interfaceRelationships.forEach((i) => {
        if (!generatedResolvers[i.name.value]) {
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

    return {
        nodes,
        relationships,
        typeDefs: parsedDoc,
        resolvers: generatedResolvers,
    };
}

export default makeAugmentedSchema;
