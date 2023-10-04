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

import type { IResolvers } from "@graphql-tools/utils";
import type {
    DefinitionNode,
    DirectiveNode,
    DocumentNode,
    GraphQLScalarType,
    NameNode,
    ObjectTypeDefinitionNode,
    SchemaExtensionNode,
} from "graphql";
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString, Kind, parse, print } from "graphql";
import type { ObjectTypeComposer } from "graphql-compose";
import { SchemaComposer } from "graphql-compose";
import type { Node } from "../classes";
import type Relationship from "../classes/Relationship";
import * as Scalars from "../graphql/scalars";
import { AggregationTypesMapper } from "./aggregations/aggregation-types-mapper";
import { augmentFulltextSchema } from "./augment/fulltext";
import { ensureNonEmptyInput } from "./ensure-non-empty-input";
import getCustomResolvers from "./get-custom-resolvers";
import { getDefinitionNodes } from "./get-definition-nodes";
import type { ObjectFields } from "./get-obj-field-meta";
import getObjFieldMeta from "./get-obj-field-meta";
import { cypherResolver } from "./resolvers/field/cypher";
import { createResolver } from "./resolvers/mutation/create";
import { deleteResolver } from "./resolvers/mutation/delete";
import { updateResolver } from "./resolvers/mutation/update";
import { aggregateResolver } from "./resolvers/query/aggregate";
import { findResolver } from "./resolvers/query/read";
import { rootConnectionResolver } from "./resolvers/query/root-connection";
import { attributeAdapterToComposeFields, graphqlDirectivesToCompose } from "./to-compose";

// GraphQL type imports
import type { GraphQLToolsResolveMethods } from "graphql-compose/lib/SchemaComposer";
import type { Subgraph } from "../classes/Subgraph";
import { CreateInfo } from "../graphql/objects/CreateInfo";
import { DeleteInfo } from "../graphql/objects/DeleteInfo";
import { PageInfo } from "../graphql/objects/PageInfo";
import { UpdateInfo } from "../graphql/objects/UpdateInfo";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import type { Operation } from "../schema-model/Operation";
import { OperationAdapter } from "../schema-model/OperationAdapter";
import { InterfaceEntity } from "../schema-model/entity/InterfaceEntity";
import { UnionEntity } from "../schema-model/entity/UnionEntity";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { CypherField, Neo4jFeaturesSettings } from "../types";
import { filterTruthy } from "../utils/utils";
import { createConnectionFields } from "./create-connection-fields";
import { addGlobalNodeFields } from "./create-global-nodes";
import { createRelationshipFields } from "./create-relationship-fields/create-relationship-fields";
import { deprecationMap } from "./deprecation-map";
import { withAggregateSelectionType } from "./generation/aggregate-types";
import { withCreateInputType } from "./generation/create-input";
import { withInterfaceType } from "./generation/interface-type";
import { withObjectType } from "./generation/object-type";
import { withMutationResponseTypes } from "./generation/response-types";
import { withOptionsInputType, withSortInputType } from "./generation/sort-and-options-input";
import { withUpdateInputType } from "./generation/update-input";
import { withUniqueWhereInputType, withWhereInputType } from "./generation/where-input";
import getNodes from "./get-nodes";
import { getResolveAndSubscriptionMethods } from "./get-resolve-and-subscription-methods";
import { filterInterfaceTypes } from "./make-augmented-schema/filter-interface-types";
import { getUserDefinedDirectives } from "./make-augmented-schema/user-defined-directives";
import { generateSubscriptionTypes } from "./subscriptions/generate-subscription-types";
import { AugmentedSchemaGenerator } from "./generation/AugmentedSchemaGenerator";

function definitionNodeHasName(x: DefinitionNode): x is DefinitionNode & { name: NameNode } {
    return "name" in x;
}

function makeAugmentedSchema({
    document,
    features,
    userCustomResolvers,
    subgraph,
    schemaModel,
    experimental,
}: {
    document: DocumentNode;
    features?: Neo4jFeaturesSettings;
    userCustomResolvers?: IResolvers | Array<IResolvers>;
    subgraph?: Subgraph;
    schemaModel: Neo4jGraphQLSchemaModel;
    experimental: boolean;
}): {
    nodes: Node[];
    relationships: Relationship[];
    typeDefs: DocumentNode;
    resolvers: IResolvers;
} {
    const composer = new SchemaComposer();
    const callbacks = features?.populatedBy?.callbacks;

    let relationships: Relationship[] = [];

    const definitionNodes = getDefinitionNodes(document);
    const customResolvers = getCustomResolvers(document);
    const { interfaceTypes, scalarTypes, objectTypes, enumTypes, unionTypes, schemaExtensions } = definitionNodes;

    // TODO: maybe use schemaModel.definitionCollection instead of definitionNodes? need to add inputObjectTypes and customResolvers
    const schemaGenerator = new AugmentedSchemaGenerator(
        schemaModel,
        definitionNodes,
        [customResolvers.customQuery, customResolvers.customMutation, customResolvers.customSubscription].filter(
            (x): x is ObjectTypeDefinitionNode => Boolean(x)
        )
    );
    const generatorComposer = schemaGenerator.generate();
    composer.merge(generatorComposer);

    // TODO: move these to SchemaGenerator once the other types are moved (in the meantime references to object types are causing errors because they are not present in the generated schema)
    const pipedDefs = [
        ...definitionNodes.enumTypes,
        ...definitionNodes.scalarTypes,
        ...definitionNodes.inputObjectTypes,
        ...definitionNodes.unionTypes,
        ...definitionNodes.directives,
        ...filterTruthy([
            customResolvers.customQuery,
            customResolvers.customMutation,
            customResolvers.customSubscription,
        ]),
    ];
    if (pipedDefs.length) {
        composer.addTypeDefs(print({ kind: Kind.DOCUMENT, definitions: pipedDefs }));
    }

    // Loop over all entries in the deprecation map and add field deprecations to all types in the map.
    for (const [typeName, deprecatedFields] of deprecationMap) {
        const typeComposer = composer.getOTC(typeName);
        typeComposer.deprecateFields(
            deprecatedFields.reduce((acc, { field, reason }) => ({ ...acc, [field]: reason }), {})
        );
    }

    // TODO: ideally move these in getSubgraphSchema()
    if (subgraph) {
        const shareable = subgraph.getFullyQualifiedDirectiveName("shareable");
        [CreateInfo.name, UpdateInfo.name, DeleteInfo.name, PageInfo.name].forEach((typeName) => {
            const typeComposer = composer.getOTC(typeName);
            typeComposer.setDirectiveByName(shareable);
        });
    }

    const aggregationTypesMapper = new AggregationTypesMapper(composer, subgraph);

    const getNodesResult = getNodes(definitionNodes, { callbacks, userCustomResolvers });

    const { nodes, relationshipPropertyInterfaceNames, interfaceRelationshipNames } = getNodesResult;

    const hasGlobalNodes = addGlobalNodeFields(nodes, composer, schemaModel.concreteEntities);

    const { relationshipProperties, interfaceRelationships, filteredInterfaceTypes } = filterInterfaceTypes(
        interfaceTypes,
        relationshipPropertyInterfaceNames,
        interfaceRelationshipNames
    );

    const {
        userDefinedFieldDirectivesForNode,
        userDefinedDirectivesForNode,
        propagatedDirectivesForNode,
        userDefinedDirectivesForInterface,
    } = getUserDefinedDirectives(definitionNodes);

    /**
     * TODO [translation-layer-compatibility]
     * keeping this `relationshipFields` scaffold for backwards compatibility on translation layer
     * actual functional logic is in schemaModel.concreteEntities.forEach
     */
    const relationshipFields = new Map<string, ObjectFields>();
    relationshipProperties.forEach((relationship) => {
        const relFields = getObjFieldMeta({
            enums: enumTypes,
            interfaces: filteredInterfaceTypes,
            objects: objectTypes,
            scalars: scalarTypes,
            unions: unionTypes,
            obj: relationship,
            callbacks,
        });

        relationshipFields.set(relationship.name.value, relFields);
    });

    // this is the new "functional" way for the above forEach
    // helper to only create relationshipProperties Interface types once, even if multiple relationships reference it
    const seenRelationshipPropertiesInterfaces = new Set<string>();
    schemaModel.concreteEntities.forEach((concreteEntity) => {
        const concreteEntityAdapter = new ConcreteEntityAdapter(concreteEntity);

        for (const relationshipAdapter of concreteEntityAdapter.relationships.values()) {
            {
                if (
                    !relationshipAdapter.propertiesTypeName ||
                    seenRelationshipPropertiesInterfaces.has(relationshipAdapter.propertiesTypeName)
                ) {
                    continue;
                }
                doForRelationshipPropertiesInterface({
                    composer,
                    relationshipAdapter,
                    userDefinedDirectivesForInterface,
                    userDefinedFieldDirectivesForNode,
                    features,
                });
                seenRelationshipPropertiesInterfaces.add(relationshipAdapter.propertiesTypeName);
            }
        }
    });

    // temporary helper to keep track of which interface entities were already "visited"
    // currently generated schema depends on these types being created BEFORE the rest
    // ideally the dependency should be eradicated and these should be part of the schemaModel.compositeEntities.forEach
    const seenInterfaces = new Set<string>();
    interfaceRelationships.forEach((interfaceRelationship) => {
        const interfaceEntity = schemaModel.getEntity(interfaceRelationship.name.value) as InterfaceEntity;
        const interfaceEntityAdapter = new InterfaceEntityAdapter(interfaceEntity);
        const updatedRelationships = doForInterfacesThatAreTargetOfARelationship({
            composer,
            interfaceEntityAdapter,
            subgraph,
            relationships,
            relationshipFields,
            userDefinedFieldDirectivesForNode,
            propagatedDirectivesForNode,
            experimental,
        });
        if (updatedRelationships) {
            relationships = updatedRelationships;
        }
        seenInterfaces.add(interfaceRelationship.name.value);
    });

    schemaModel.concreteEntities.forEach((concreteEntity) => {
        /**
         * TODO [translation-layer-compatibility]
         * need the node for fulltext translation
         */
        const node = nodes.find((n) => n.name === concreteEntity.name);
        if (!node) {
            throw new Error(`Node not found with the name ${concreteEntity.name}`);
        }
        const concreteEntityAdapter = new ConcreteEntityAdapter(concreteEntity);

        const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(concreteEntityAdapter.name);
        if (!userDefinedFieldDirectives) {
            throw new Error(`User defined field directives not found for ${concreteEntityAdapter.name}`);
        }

        const propagatedDirectives = propagatedDirectivesForNode.get(concreteEntity.name) || [];
        const userDefinedObjectDirectives = (userDefinedDirectivesForNode.get(concreteEntity.name) || []).concat(
            propagatedDirectives
        );

        withOptionsInputType({ entityAdapter: concreteEntityAdapter, userDefinedFieldDirectives, composer });
        withAggregateSelectionType({ concreteEntityAdapter, aggregationTypesMapper, propagatedDirectives, composer });
        withWhereInputType({ entityAdapter: concreteEntityAdapter, userDefinedFieldDirectives, features, composer });
        /**
         * TODO [translation-layer-compatibility]
         * Need to migrate resolvers, which themselves rely on the translation layer being migrated to the new schema model
         */
        augmentFulltextSchema(node, composer, concreteEntityAdapter);
        withUniqueWhereInputType({ concreteEntityAdapter, composer });
        withCreateInputType({ entityAdapter: concreteEntityAdapter, userDefinedFieldDirectives, composer });
        withUpdateInputType({ entityAdapter: concreteEntityAdapter, userDefinedFieldDirectives, composer });
        withMutationResponseTypes({ concreteEntityAdapter, propagatedDirectives, composer });
        const composeNode = withObjectType({
            concreteEntityAdapter,
            userDefinedFieldDirectives,
            userDefinedObjectDirectives,
            composer,
        });
        createRelationshipFields({
            entityAdapter: concreteEntityAdapter,
            schemaComposer: composer,
            composeNode,
            subgraph,
            userDefinedFieldDirectives,
        });
        relationships = [
            ...relationships,
            ...createConnectionFields({
                entityAdapter: concreteEntityAdapter,
                schemaComposer: composer,
                composeNode,
                userDefinedFieldDirectives,
                relationshipFields,
            }),
        ];

        ensureNonEmptyInput(composer, concreteEntityAdapter.operations.updateInputTypeName);
        ensureNonEmptyInput(composer, concreteEntityAdapter.operations.createInputTypeName);

        if (concreteEntityAdapter.isReadable) {
            composer.Query.addFields({
                [concreteEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                    node,
                    entityAdapter: concreteEntityAdapter,
                }),
            });
            composer.Query.setFieldDirectives(
                concreteEntityAdapter.operations.rootTypeFieldNames.read,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
            composer.Query.addFields({
                [concreteEntityAdapter.operations.rootTypeFieldNames.connection]: rootConnectionResolver({
                    node,
                    composer,
                    concreteEntityAdapter,
                    propagatedDirectives,
                }),
            });
            composer.Query.setFieldDirectives(
                concreteEntityAdapter.operations.rootTypeFieldNames.connection,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }
        if (concreteEntityAdapter.isAggregable) {
            composer.Query.addFields({
                [concreteEntityAdapter.operations.rootTypeFieldNames.aggregate]: aggregateResolver({
                    node,
                    concreteEntityAdapter,
                }),
            });
            composer.Query.setFieldDirectives(
                concreteEntityAdapter.operations.rootTypeFieldNames.aggregate,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }

        if (concreteEntityAdapter.isCreatable) {
            composer.Mutation.addFields({
                [concreteEntityAdapter.operations.rootTypeFieldNames.create]: createResolver({
                    node,
                    concreteEntityAdapter,
                }),
            });
            composer.Mutation.setFieldDirectives(
                concreteEntityAdapter.operations.rootTypeFieldNames.create,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }

        if (concreteEntityAdapter.isDeletable) {
            composer.Mutation.addFields({
                [concreteEntityAdapter.operations.rootTypeFieldNames.delete]: deleteResolver({
                    node,
                    composer,
                    concreteEntityAdapter,
                }),
            });
            composer.Mutation.setFieldDirectives(
                concreteEntityAdapter.operations.rootTypeFieldNames.delete,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }

        if (concreteEntityAdapter.isUpdatable) {
            composer.Mutation.addFields({
                [concreteEntityAdapter.operations.rootTypeFieldNames.update]: updateResolver({
                    node,
                    composer,
                    concreteEntityAdapter,
                }),
            });
            composer.Mutation.setFieldDirectives(
                concreteEntityAdapter.operations.rootTypeFieldNames.update,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }
    });

    schemaModel.compositeEntities.forEach((entity) => {
        if (entity instanceof UnionEntity) {
            const unionEntityAdapter = new UnionEntityAdapter(entity);
            withWhereInputType({
                entityAdapter: unionEntityAdapter,
                userDefinedFieldDirectives: new Map<string, DirectiveNode[]>(),
                features,
                composer,
            });
            if (experimental) {
                if (unionEntityAdapter.isReadable) {
                    composer.Query.addFields({
                        [unionEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                            entityAdapter: unionEntityAdapter,
                        }),
                    });
                }
            }
            return;
        }
        if (entity instanceof InterfaceEntity && !seenInterfaces.has(entity.name)) {
            const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(entity.name) as Map<
                string,
                DirectiveNode[]
            >;
            const userDefinedInterfaceDirectives = userDefinedDirectivesForInterface.get(entity.name) || [];
            const propagatedDirectives = propagatedDirectivesForNode.get(entity.name) || [];
            const interfaceEntityAdapter = new InterfaceEntityAdapter(entity);
            withInterfaceType({
                entityAdapter: interfaceEntityAdapter,
                userDefinedFieldDirectives,
                userDefinedInterfaceDirectives,
                composer,
                config: {
                    includeRelationships: true,
                },
            });
            if (experimental) {
                // TODO: mirror everything on interfaces target of relationships
                // TODO [top-level-abstract-types-filtering]: _on should contain also implementing interface types?
                if (interfaceEntityAdapter.isReadable) {
                    composer.Query.addFields({
                        [interfaceEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                            entityAdapter: interfaceEntityAdapter,
                        }),
                    });
                    composer.Query.setFieldDirectives(
                        interfaceEntityAdapter.operations.rootTypeFieldNames.read,
                        graphqlDirectivesToCompose(propagatedDirectives)
                    );
                }
            }
            return;
        }
        return;
    });

    if (Boolean(features?.subscriptions) && nodes.length) {
        generateSubscriptionTypes({
            schemaComposer: composer,
            schemaModel,
            userDefinedFieldDirectivesForNode,
        });
    }

    ["Query", "Mutation"].forEach((type) => {
        const objectComposer: ObjectTypeComposer = composer[type];

        const operation: Operation | undefined = schemaModel.operations[type];
        if (!operation) {
            return;
        }
        const operationAdapter = new OperationAdapter(operation);
        const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(type) as Map<string, DirectiveNode[]>;

        for (const attributeAdapter of operationAdapter.attributes.values()) {
            /**
             * TODO [translation-layer-compatibility]
             * needed for compatibility with translation layer
             */
            const objectFields = getObjFieldMeta({
                obj: customResolvers[`customCypher${type}`],
                scalars: scalarTypes,
                enums: enumTypes,
                interfaces: filteredInterfaceTypes,
                unions: unionTypes,
                objects: objectTypes,
                callbacks,
            });
            const field = objectFields.cypherFields.find((f) => f.fieldName === attributeAdapter.name) as CypherField;
            const customResolver = cypherResolver({
                field,
                attributeAdapter,
                type: type as "Query" | "Mutation",
            });

            const composedField = attributeAdapterToComposeFields([attributeAdapter], userDefinedFieldDirectives)[
                attributeAdapter.name
            ];

            objectComposer.addFields({ [attributeAdapter.name]: { ...composedField, ...customResolver } });
        }
    });

    if (!Object.values(composer.Mutation.getFields()).length) {
        composer.delete("Mutation");
    }
    if (!Object.values(composer.Subscription.getFields()).length) {
        composer.delete("Subscription");
    }

    const generatedTypeDefs = composer.toSDL();

    let parsedDoc = parse(generatedTypeDefs);

    const documentNames = new Set(parsedDoc.definitions.filter(definitionNodeHasName).map((x) => x.name.value));
    const resolveMethods = getResolveAndSubscriptionMethods(composer);

    const generatedResolveMethods: GraphQLToolsResolveMethods<any> = {};

    for (const [key, value] of Object.entries(resolveMethods)) {
        if (documentNames.has(key)) {
            generatedResolveMethods[key] = value;
        }
    }

    const generatedResolvers = {
        ...generatedResolveMethods,
        ...Object.values(Scalars).reduce((res, scalar: GraphQLScalarType) => {
            if (generatedTypeDefs.includes(`scalar ${scalar.name}\n`)) {
                res[scalar.name] = scalar;
            }
            return res;
        }, {}),
        ...(hasGlobalNodes ? { Node: { __resolveType: (root) => root.__resolveType } } : {}),
    };

    schemaModel.compositeEntities.forEach((compositeEntityAdapter) => {
        let shouldGenerateResolver = true;
        if (compositeEntityAdapter instanceof UnionEntity) {
            // It is possible to make union types "writeonly". In this case adding a resolver for them breaks schema generation.
            shouldGenerateResolver = parsedDoc.definitions.some((def): boolean => {
                if (def.kind === Kind.UNION_TYPE_DEFINITION && def.name.value === compositeEntityAdapter.name)
                    return true;
                return false;
            });
        }
        if (shouldGenerateResolver && !generatedResolvers[compositeEntityAdapter.name]) {
            generatedResolvers[compositeEntityAdapter.name] = {
                __resolveType: (root) => root.__resolveType,
            };
        }
    });

    // do not propagate Neo4jGraphQL directives on schema extensions
    const schemaExtensionsWithoutNeo4jDirectives = schemaExtensions.map((schemaExtension): SchemaExtensionNode => {
        return {
            kind: schemaExtension.kind,
            loc: schemaExtension.loc,
            operationTypes: schemaExtension.operationTypes,
            directives: schemaExtension.directives?.filter(
                (schemaDirective) =>
                    !["query", "mutation", "subscription", "authentication"].includes(schemaDirective.name.value)
            ),
        };
    });
    const seen = {};
    parsedDoc = {
        ...parsedDoc,
        definitions: [
            ...parsedDoc.definitions.filter((definition) => {
                // Filter out default scalars, they are not needed and can cause issues
                if (definition.kind === Kind.SCALAR_TYPE_DEFINITION) {
                    if (
                        [
                            GraphQLBoolean.name,
                            GraphQLFloat.name,
                            GraphQLID.name,
                            GraphQLInt.name,
                            GraphQLString.name,
                        ].includes(definition.name.value)
                    ) {
                        return false;
                    }
                }

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
            ...schemaExtensionsWithoutNeo4jDirectives,
        ],
    };

    return {
        nodes,
        relationships,
        typeDefs: parsedDoc,
        resolvers: generatedResolvers,
    };
}

export default makeAugmentedSchema;

function doForRelationshipPropertiesInterface({
    composer,
    relationshipAdapter,
    userDefinedDirectivesForInterface,
    userDefinedFieldDirectivesForNode,
    features,
}: {
    composer: SchemaComposer;
    relationshipAdapter: RelationshipAdapter;
    userDefinedDirectivesForInterface: Map<string, DirectiveNode[]>;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    features?: Neo4jFeaturesSettings;
}) {
    if (!relationshipAdapter.propertiesTypeName) {
        return;
    }
    const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(
        relationshipAdapter.propertiesTypeName
    ) as Map<string, DirectiveNode[]>;
    const userDefinedInterfaceDirectives = userDefinedDirectivesForInterface.get(relationshipAdapter.name) || [];
    withInterfaceType({
        entityAdapter: relationshipAdapter,
        userDefinedFieldDirectives,
        userDefinedInterfaceDirectives,
        composer,
    });
    withSortInputType({ relationshipAdapter, userDefinedFieldDirectives, composer });
    withUpdateInputType({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, composer });
    withWhereInputType({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, features, composer });
    withCreateInputType({ entityAdapter: relationshipAdapter, userDefinedFieldDirectives, composer });
}

function doForInterfacesThatAreTargetOfARelationship({
    composer,
    interfaceEntityAdapter,
    features,
    subgraph,
    relationships,
    relationshipFields,
    userDefinedFieldDirectivesForNode,
    propagatedDirectivesForNode,
    experimental,
}: {
    composer: SchemaComposer;
    interfaceEntityAdapter: InterfaceEntityAdapter;
    features?: Neo4jFeaturesSettings;
    subgraph?: Subgraph;
    relationships: Relationship[];
    relationshipFields: Map<string, ObjectFields>;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    propagatedDirectivesForNode: Map<string, DirectiveNode[]>;
    experimental: boolean;
}) {
    const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(interfaceEntityAdapter.name) as Map<
        string,
        DirectiveNode[]
    >;
    withOptionsInputType({ entityAdapter: interfaceEntityAdapter, userDefinedFieldDirectives, composer });
    withWhereInputType({ entityAdapter: interfaceEntityAdapter, userDefinedFieldDirectives, features, composer });
    withCreateInputType({ entityAdapter: interfaceEntityAdapter, userDefinedFieldDirectives, composer });
    withUpdateInputType({ entityAdapter: interfaceEntityAdapter, userDefinedFieldDirectives, composer });

    const composeInterface = withInterfaceType({
        entityAdapter: interfaceEntityAdapter,
        userDefinedFieldDirectives,
        userDefinedInterfaceDirectives: [],
        composer,
    });
    createRelationshipFields({
        entityAdapter: interfaceEntityAdapter,
        schemaComposer: composer,
        composeNode: composeInterface,
        subgraph,
        userDefinedFieldDirectives,
    });

    relationships = [
        ...relationships,
        ...createConnectionFields({
            entityAdapter: interfaceEntityAdapter,
            schemaComposer: composer,
            composeNode: composeInterface,
            userDefinedFieldDirectives,
            relationshipFields,
        }),
    ];

    if (experimental) {
        const propagatedDirectives = propagatedDirectivesForNode.get(interfaceEntityAdapter.name) || [];
        if (interfaceEntityAdapter.isReadable) {
            composer.Query.addFields({
                [interfaceEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                    entityAdapter: interfaceEntityAdapter,
                }),
            });
            composer.Query.setFieldDirectives(
                interfaceEntityAdapter.operations.rootTypeFieldNames.read,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }
    }

    return relationships;
}
