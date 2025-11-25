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
    InterfaceTypeDefinitionNode,
    NameNode,
    ObjectTypeDefinitionNode,
    SchemaExtensionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString, Kind, parse, print } from "graphql";
import type { ObjectTypeComposer } from "graphql-compose";
import { SchemaComposer } from "graphql-compose";
import * as Scalars from "../graphql/scalars";
import { AggregationTypesMapper } from "./aggregations/aggregation-types-mapper";
import { augmentFulltextSchema } from "./augment/fulltext";
import { ensureNonEmptyInput } from "./ensure-non-empty-input";
import getCustomResolvers from "./get-custom-resolvers";
import { createResolver } from "./resolvers/mutation/create";
import { deleteResolver } from "./resolvers/mutation/delete";
import { updateResolver } from "./resolvers/mutation/update";
import { findResolver } from "./resolvers/query/read";
import { rootConnectionResolver } from "./resolvers/query/root-connection";
import { attributeAdapterToComposeFields, graphqlDirectivesToCompose } from "./to-compose";

// GraphQL type imports
import type { GraphQLToolsResolveMethods } from "graphql-compose/lib/SchemaComposer";
import { type ComplexityEstimatorHelper } from "../classes/ComplexityEstimatorHelper";
import type { Subgraph } from "../classes/Subgraph";
import { SHAREABLE } from "../constants";
import { CreateInfo } from "../graphql/objects/CreateInfo";
import { DeleteInfo } from "../graphql/objects/DeleteInfo";
import { PageInfo } from "../graphql/objects/PageInfo";
import { UpdateInfo } from "../graphql/objects/UpdateInfo";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import type { Operation } from "../schema-model/Operation";
import { OperationAdapter } from "../schema-model/OperationAdapter";
import { ConcreteEntity } from "../schema-model/entity/ConcreteEntity";
import { InterfaceEntity } from "../schema-model/entity/InterfaceEntity";
import { UnionEntity } from "../schema-model/entity/UnionEntity";
import { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../schema-model/entity/model-adapters/UnionEntityAdapter";
import { getDefinitionCollection } from "../schema-model/parser/definition-collection";
import { RelationshipDeclarationAdapter } from "../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { Neo4jFeaturesSettings } from "../types";
import { asArray, filterTruthy } from "../utils/utils";
import { augmentVectorSchema } from "./augment/vector";
import { addGlobalNodeFields } from "./create-global-nodes";
import { createRelationshipFields } from "./create-relationship-fields/create-relationship-fields";
import { AugmentedSchemaGenerator } from "./generation/AugmentedSchemaGenerator";
import { withAggregateSelectionType } from "./generation/aggregate-types";
import { withCreateInputType } from "./generation/create-input";
import { withInterfaceType } from "./generation/interface-type";
import { withObjectType } from "./generation/object-type";
import { withMutationResponseTypes } from "./generation/response-types";
import { withUpdateInputType } from "./generation/update-input";
import { withUniqueWhereInputType, withWhereInputType } from "./generation/where-input";
import { getResolveAndSubscriptionMethods } from "./get-resolve-and-subscription-methods";
import { getUserDefinedDirectives } from "./make-augmented-schema/user-defined-directives";
import { cypherResolver } from "./resolvers/query/cypher";
import { generateSubscriptionTypes } from "./subscriptions/generate-subscription-types";

function definitionNodeHasName(x: DefinitionNode): x is DefinitionNode & { name: NameNode } {
    return "name" in x;
}

function makeAugmentedSchema({
    document,
    features,
    subgraph,
    schemaModel,
    complexityEstimatorHelper,
}: {
    document: DocumentNode;
    features?: Neo4jFeaturesSettings;
    subgraph?: Subgraph;
    schemaModel: Neo4jGraphQLSchemaModel;
    complexityEstimatorHelper: ComplexityEstimatorHelper;
}): {
    typeDefs: DocumentNode;
    resolvers: IResolvers;
} {
    const composer = new SchemaComposer();

    //TODO: definition collection is being used to harmonize schema generation with schema model,
    //however make augmented schema inner methods are still accepting arrays as they were defined by the previous getDefinitionNodes
    const definitionCollection = getDefinitionCollection(document);

    const {
        // interfaceTypes,
        scalarTypes,
        userDefinedObjectTypes,
        enumTypes,
        unionTypes,
        inputTypes,
        directives,
        schemaExtensions,
    } = definitionCollection;

    const customResolvers = getCustomResolvers(document);

    const schemaGenerator = new AugmentedSchemaGenerator(
        schemaModel,
        definitionCollection,
        [customResolvers.customQuery, customResolvers.customMutation, customResolvers.customSubscription].filter(
            (x): x is ObjectTypeDefinitionNode => Boolean(x)
        )
    );
    const generatorComposer = schemaGenerator.generate();
    composer.merge(generatorComposer);

    // Generates the filters for enums, which are reused
    Array.from(enumTypes.values()).forEach((enumType) => {
        composer.createInputTC({
            name: `${enumType.name.value}EnumScalarFilters`,
            description: `${enumType.name.value} filters`,
            fields: {
                eq: {
                    type: enumType.name.value,
                },
                in: { type: `[${enumType.name.value}!]` },
            },
        });
        composer.createInputTC({
            name: `${enumType.name.value}ListEnumScalarFilters`,
            description: `${enumType.name.value} filters`,
            fields: {
                eq: {
                    type: `[${enumType.name.value}!]`,
                },
                includes: {
                    type: enumType.name.value,
                },
            },
        });
    });

    // Generates the mutations for enums, which are reused
    Array.from(enumTypes.values()).forEach((enumType) => {
        composer.createInputTC({
            name: `${enumType.name.value}EnumScalarMutations`,
            description: `${enumType.name.value} mutations`,
            fields: {
                set: { type: enumType.name.value },
            },
        });
        composer.createInputTC({
            name: `${enumType.name.value}ListEnumScalarMutations`,
            description: `Mutations for a list for ${enumType.name.value}`,
            fields: {
                set: { type: `[${enumType.name.value}!]` },
                push: { type: `[${enumType.name.value}!]` },
                pop: { type: enumType.name.value },
            },
        });
    });

    // Generates the filters for custom scalars
    Array.from(scalarTypes.values()).forEach((scalarType) => {
        composer.createInputTC({
            name: `${scalarType.name.value}ScalarFilters`,
            description: `${scalarType.name.value} filters`,
            fields: {
                eq: {
                    type: scalarType.name.value,
                },
                in: { type: `[${scalarType.name.value}!]` },
            },
        });

        composer.createInputTC({
            name: `${scalarType.name.value}ListScalarFilters`,
            description: `${scalarType.name.value} filters`,
            fields: {
                eq: {
                    type: `[${scalarType.name.value}!]`,
                },
                includes: {
                    type: scalarType.name.value,
                },
            },
        });
    });

    // Generates the mutations for custom scalars
    Array.from(scalarTypes.values()).forEach((scalarType) => {
        composer.createInputTC({
            name: `${scalarType.name.value}ScalarMutations`,
            description: `${scalarType.name.value} filters`,
            fields: {
                set: { type: scalarType.name.value },
            },
        });

        composer.createInputTC({
            name: `${scalarType.name.value}ListScalarMutations`,
            description: `Mutations for a list for ${scalarType.name.value}`,
            fields: {
                set: { type: `[${scalarType.name.value}!]` },
                push: { type: `[${scalarType.name.value}!]` },
                pop: { type: scalarType.name.value },
            },
        });
    });

    // TODO: move these to SchemaGenerator once the other types are moved (in the meantime references to object types are causing errors because they are not present in the generated schema)
    const pipedDefs = [
        ...userDefinedObjectTypes.values(),
        ...enumTypes.values(),
        ...scalarTypes.values(),
        ...inputTypes.values(),
        ...unionTypes.values(),
        ...directives.values(),
        ...filterTruthy([
            customResolvers.customQuery,
            customResolvers.customMutation,
            customResolvers.customSubscription,
        ]),
    ];

    if (pipedDefs.length) {
        composer.addTypeDefs(print({ kind: Kind.DOCUMENT, definitions: pipedDefs }));
    }

    // TODO: ideally move these in getSubgraphSchema()
    if (subgraph) {
        const shareable = subgraph.getFullyQualifiedDirectiveName(SHAREABLE);
        [CreateInfo.name, UpdateInfo.name, DeleteInfo.name, PageInfo.name].forEach((typeName) => {
            const typeComposer = composer.getOTC(typeName);
            typeComposer.setDirectiveByName(shareable);
        });
    }

    const aggregationTypesMapper = new AggregationTypesMapper(composer, subgraph);
    const hasGlobalNodes = addGlobalNodeFields(composer, schemaModel.concreteEntities);

    const {
        userDefinedFieldDirectivesForNode,
        userDefinedDirectivesForNode,
        propagatedDirectivesForNode,
        userDefinedDirectivesForInterface,
        userDefinedDirectivesForUnion,
    } = getUserDefinedDirectives(definitionCollection);

    // helper to only create relationshipProperties Interface types once, even if multiple relationships reference it
    const seenRelationshipPropertiesTypes = new Set<string>();
    schemaModel.entities.forEach((entity) => {
        if (entity instanceof UnionEntity) {
            const unionEntityAdapter = new UnionEntityAdapter(entity);
            withWhereInputType({
                entityAdapter: unionEntityAdapter,
                userDefinedFieldDirectives: new Map<string, DirectiveNode[]>(),
                features,
                composer,
            });
            // strip-out the schema config directives from the union type
            const def = composer.getUTC(unionEntityAdapter.name);
            def.setDirectives(
                graphqlDirectivesToCompose(userDefinedDirectivesForUnion.get(unionEntityAdapter.name) || [])
            );
            const hasImplementedEntities = unionEntityAdapter.concreteEntities.length > 0;

            if (unionEntityAdapter.isReadable(schemaModel) && hasImplementedEntities) {
                complexityEstimatorHelper.registerField("Query", unionEntityAdapter.operations.rootTypeFieldNames.read);
                composer.Query.addFields({
                    [unionEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                        entityAdapter: unionEntityAdapter,
                        composer,
                        isLimitRequired: features?.limitRequired,
                    }),
                });
            }
            return;
        }
        if (entity instanceof InterfaceEntity) {
            const interfaceEntityAdapter = new InterfaceEntityAdapter(entity);
            const userDefinedInterfaceDirectives = userDefinedDirectivesForInterface.get(entity.name) || [];
            generateInterfaceObjectType({
                composer,
                interfaceEntityAdapter,
                subgraph,
                userDefinedInterfaceDirectives,
                userDefinedFieldDirectivesForNode,
                propagatedDirectivesForNode,
                aggregationTypesMapper,
                seenRelationshipPropertiesTypes,
                features,
                complexityEstimatorHelper,
                schemaModel,
            });
            return;
        }
        if (entity instanceof ConcreteEntity) {
            const concreteEntityAdapter = new ConcreteEntityAdapter(entity);
            const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(concreteEntityAdapter.name);
            if (!userDefinedFieldDirectives) {
                throw new Error(`User defined field directives not found for ${concreteEntityAdapter.name}`);
            }

            const propagatedDirectives = propagatedDirectivesForNode.get(entity.name) || [];
            const userDefinedObjectDirectives = (userDefinedDirectivesForNode.get(entity.name) || []).concat(
                propagatedDirectives
            );
            generateObjectType({
                composer,
                concreteEntityAdapter,
                subgraph,
                features,
                userDefinedObjectDirectives,
                userDefinedFieldDirectives,
                propagatedDirectives,
                aggregationTypesMapper,
                seenRelationshipPropertiesTypes,
                userDefinedDirectivesForNode,
                userDefinedFieldDirectivesForNode,
                complexityEstimatorHelper,
                schemaModel,
            });
            return;
        }
    });

    if (schemaModel.concreteEntities.length) {
        generateSubscriptionTypes({
            schemaComposer: composer,
            schemaModel,
            userDefinedFieldDirectivesForNode,
            features,
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
            const customResolver = cypherResolver({
                attributeAdapter,
                type: type as "Query" | "Mutation",
            });

            const composedField = attributeAdapterToComposeFields([attributeAdapter], userDefinedFieldDirectives)[
                attributeAdapter.name
            ];

            objectComposer.addFields({ [attributeAdapter.name]: { ...composedField, ...customResolver } });
        }

        // this is to remove library directives from custom resolvers on root type fields in augmented schema
        for (const attributeAdapter of operationAdapter.userResolvedAttributes.values()) {
            const composedField = attributeAdapterToComposeFields([attributeAdapter], userDefinedFieldDirectives)[
                attributeAdapter.name
            ];
            if (composedField) {
                objectComposer.addFields({ [attributeAdapter.name]: composedField });
            }
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

    // TODO: improve this logic so we don't iterate through the entire document for each compositeEntity
    // It is possible to make types "writeonly". In this case adding a resolver for them breaks schema generation.
    schemaModel.compositeEntities.forEach((compositeEntity) => {
        const definitionIsOfTheSameType = (
            def: DefinitionNode
        ): def is UnionTypeDefinitionNode | InterfaceTypeDefinitionNode =>
            (def.kind === Kind.UNION_TYPE_DEFINITION && compositeEntity instanceof UnionEntity) ||
            (def.kind === Kind.INTERFACE_TYPE_DEFINITION && compositeEntity instanceof InterfaceEntity);

        const shouldGenerateResolver = parsedDoc.definitions.some((def): boolean => {
            if (definitionIsOfTheSameType(def) && def.name.value === compositeEntity.name) {
                return true;
            }
            return false;
        });
        if (shouldGenerateResolver && !generatedResolvers[compositeEntity.name]) {
            generatedResolvers[compositeEntity.name] = {
                __resolveType: (root) => root.__resolveType,
            };
        }
        if (compositeEntity instanceof InterfaceEntity) {
            for (const relationshipDeclaration of compositeEntity.relationshipDeclarations.values()) {
                const relationshipDeclarationPropertiesType = new RelationshipDeclarationAdapter(
                    relationshipDeclaration
                ).operations.relationshipPropertiesFieldTypename;
                const isPropertiesTypeInSchema = parsedDoc.definitions.some(
                    (def): boolean => def["name"]?.value === relationshipDeclarationPropertiesType
                );
                if (isPropertiesTypeInSchema && !generatedResolvers[relationshipDeclarationPropertiesType]) {
                    generatedResolvers[relationshipDeclarationPropertiesType] = {
                        __resolveType: (root) => root.__resolveType,
                    };
                }
            }
        }
    });

    parsedDoc = {
        ...parsedDoc,
        definitions: getTransformedDefinitionNodesForAugmentedSchema({
            schemaExtensions,
            definitions: parsedDoc.definitions,
            complexityEstimatorHelper,
        }),
    };

    return {
        typeDefs: parsedDoc,
        resolvers: generatedResolvers,
    };
}

function getTransformedDefinitionNodesForAugmentedSchema({
    schemaExtensions,
    definitions,
    complexityEstimatorHelper,
}: {
    schemaExtensions: SchemaExtensionNode | undefined;
    definitions: readonly DefinitionNode[];
    complexityEstimatorHelper: ComplexityEstimatorHelper;
}): DefinitionNode[] {
    const definitionNodes: DefinitionNode[] = [];
    // do not propagate Neo4jGraphQL directives on schema extensions
    asArray(schemaExtensions).reduce((acc, schemaExtension: SchemaExtensionNode) => {
        acc.push({
            kind: schemaExtension.kind,
            loc: schemaExtension.loc,
            operationTypes: schemaExtension.operationTypes,
            directives: schemaExtension.directives?.filter(
                (schemaDirective) =>
                    !["query", "mutation", "subscription", "authentication"].includes(schemaDirective.name.value)
            ),
        });
        return acc;
    }, definitionNodes);
    // filter out some definition nodes
    // add FieldEstimator extensions for complexity calculation
    const seen = {};
    definitions.reduce<DefinitionNode[]>((acc, definition) => {
        if (shouldKeepDefinitionNode(definition, seen)) {
            acc.push(complexityEstimatorHelper.hydrateDefinitionNodeWithComplexityExtensions(definition));
        }
        return acc;
    }, definitionNodes);
    return definitionNodes;
}

function shouldKeepDefinitionNode(definition: DefinitionNode, seen: Record<string, any>) {
    // Filter out default scalars, they are not needed and can cause issues
    if (definition.kind === Kind.SCALAR_TYPE_DEFINITION) {
        if (
            [GraphQLBoolean.name, GraphQLFloat.name, GraphQLID.name, GraphQLInt.name, GraphQLString.name].includes(
                definition.name.value
            )
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
}

export default makeAugmentedSchema;

// TODO: unify object & interface fns

function generateObjectType({
    composer,
    concreteEntityAdapter,
    features,
    subgraph,
    userDefinedFieldDirectives,
    userDefinedObjectDirectives,
    propagatedDirectives,
    aggregationTypesMapper,
    seenRelationshipPropertiesTypes,
    userDefinedDirectivesForNode,
    userDefinedFieldDirectivesForNode,
    complexityEstimatorHelper,
    schemaModel,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    features?: Neo4jFeaturesSettings;
    subgraph?: Subgraph;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedObjectDirectives: DirectiveNode[];
    propagatedDirectives: DirectiveNode[];
    aggregationTypesMapper: AggregationTypesMapper;
    seenRelationshipPropertiesTypes: Set<string>;
    userDefinedDirectivesForNode: Map<string, DirectiveNode[]>;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    complexityEstimatorHelper: ComplexityEstimatorHelper;
    schemaModel: Neo4jGraphQLSchemaModel;
}) {
    withWhereInputType({
        entityAdapter: concreteEntityAdapter,
        userDefinedFieldDirectives,
        features,
        composer,
    });
    augmentFulltextSchema({ composer, concreteEntityAdapter, features, complexityEstimatorHelper });
    augmentVectorSchema({ composer, concreteEntityAdapter, features, complexityEstimatorHelper });
    withUniqueWhereInputType({ concreteEntityAdapter, composer });
    withCreateInputType({ entityAdapter: concreteEntityAdapter, userDefinedFieldDirectives, composer });
    withUpdateInputType({ entityAdapter: concreteEntityAdapter, userDefinedFieldDirectives, composer, features });
    withMutationResponseTypes({ concreteEntityAdapter, propagatedDirectives, composer });
    const composeNode = withObjectType({
        entityAdapter: concreteEntityAdapter,
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
        userDefinedDirectivesForNode,
        userDefinedFieldDirectivesForNode,
        features,
        seenRelationshipPropertiesTypes,
        complexityEstimatorHelper,
    });

    ensureNonEmptyInput(composer, concreteEntityAdapter.operations.updateInputTypeName);
    ensureNonEmptyInput(composer, concreteEntityAdapter.operations.createInputTypeName);
    if (concreteEntityAdapter.isReadable(schemaModel) || concreteEntityAdapter.isAggregable(schemaModel)) {
        complexityEstimatorHelper.registerField(
            "Query",
            concreteEntityAdapter.operations.rootTypeFieldNames.connection
        );
        composer.Query.addFields({
            [concreteEntityAdapter.operations.rootTypeFieldNames.connection]: rootConnectionResolver({
                composer,
                entityAdapter: concreteEntityAdapter,
                propagatedDirectives,
                isLimitRequired: features?.limitRequired,
                schemaModel,
            }),
        });
    }
    if (concreteEntityAdapter.isReadable(schemaModel)) {
        complexityEstimatorHelper.registerField("Query", concreteEntityAdapter.operations.rootTypeFieldNames.read);
        composer.Query.addFields({
            [concreteEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                entityAdapter: concreteEntityAdapter,
                composer,
                isLimitRequired: features?.limitRequired,
            }),
        });
        composer.Query.setFieldDirectives(
            concreteEntityAdapter.operations.rootTypeFieldNames.read,
            graphqlDirectivesToCompose(propagatedDirectives)
        );

        composer.Query.setFieldDirectives(
            concreteEntityAdapter.operations.rootTypeFieldNames.connection,
            graphqlDirectivesToCompose(propagatedDirectives)
        );
    }
    if (concreteEntityAdapter.isAggregable(schemaModel)) {
        withAggregateSelectionType({
            entityAdapter: concreteEntityAdapter,
            aggregationTypesMapper,
            propagatedDirectives,
            composer,
            features,
        });
    }

    if (concreteEntityAdapter.isCreatable) {
        composer.Mutation.addFields({
            [concreteEntityAdapter.operations.rootTypeFieldNames.create]: createResolver({
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
                concreteEntityAdapter,
            }),
        });
        composer.Mutation.setFieldDirectives(
            concreteEntityAdapter.operations.rootTypeFieldNames.update,
            graphqlDirectivesToCompose(propagatedDirectives)
        );
    }
}

function generateInterfaceObjectType({
    composer,
    interfaceEntityAdapter,
    features,
    subgraph,
    userDefinedFieldDirectivesForNode,
    userDefinedInterfaceDirectives,
    propagatedDirectivesForNode,
    aggregationTypesMapper,
    seenRelationshipPropertiesTypes,
    complexityEstimatorHelper,
    schemaModel,
}: {
    composer: SchemaComposer;
    interfaceEntityAdapter: InterfaceEntityAdapter;
    features: Neo4jFeaturesSettings | undefined;
    subgraph?: Subgraph;
    userDefinedFieldDirectivesForNode: Map<string, Map<string, DirectiveNode[]>>;
    userDefinedInterfaceDirectives: DirectiveNode[];
    propagatedDirectivesForNode: Map<string, DirectiveNode[]>;
    aggregationTypesMapper: AggregationTypesMapper;
    seenRelationshipPropertiesTypes: Set<string>;
    complexityEstimatorHelper: ComplexityEstimatorHelper;
    schemaModel: Neo4jGraphQLSchemaModel;
}) {
    const userDefinedFieldDirectives = userDefinedFieldDirectivesForNode.get(interfaceEntityAdapter.name) as Map<
        string,
        DirectiveNode[]
    >;
    withWhereInputType({
        entityAdapter: interfaceEntityAdapter,
        userDefinedFieldDirectives,
        features,
        composer,
    });
    withCreateInputType({ entityAdapter: interfaceEntityAdapter, userDefinedFieldDirectives, composer });
    withUpdateInputType({ entityAdapter: interfaceEntityAdapter, userDefinedFieldDirectives, composer, features });

    const composeInterface = withInterfaceType({
        interfaceEntityAdapter,
        userDefinedFieldDirectives,
        userDefinedInterfaceDirectives,
        composer,
    });
    createRelationshipFields({
        entityAdapter: interfaceEntityAdapter,
        schemaComposer: composer,
        composeNode: composeInterface,
        subgraph,
        userDefinedFieldDirectives,
        userDefinedDirectivesForNode: new Map<string, DirectiveNode[]>(),
        userDefinedFieldDirectivesForNode,
        features,
        seenRelationshipPropertiesTypes,
        complexityEstimatorHelper,
    });

    const hasImplementedEntities = interfaceEntityAdapter.concreteEntities.length > 0;
    if (hasImplementedEntities) {
        const propagatedDirectives = propagatedDirectivesForNode.get(interfaceEntityAdapter.name) || [];
        if (interfaceEntityAdapter.isReadable(schemaModel) || interfaceEntityAdapter.isAggregable(schemaModel)) {
            composer.Query.addFields({
                [interfaceEntityAdapter.operations.rootTypeFieldNames.connection]: rootConnectionResolver({
                    composer,
                    entityAdapter: interfaceEntityAdapter,
                    propagatedDirectives,
                    isLimitRequired: features?.limitRequired,
                    schemaModel,
                }),
            });
        }
        if (interfaceEntityAdapter.isReadable(schemaModel)) {
            complexityEstimatorHelper.registerField("Query", interfaceEntityAdapter.operations.rootTypeFieldNames.read);
            composer.Query.addFields({
                [interfaceEntityAdapter.operations.rootTypeFieldNames.read]: findResolver({
                    entityAdapter: interfaceEntityAdapter,
                    composer,
                    isLimitRequired: features?.limitRequired,
                }),
            });

            composer.Query.setFieldDirectives(
                interfaceEntityAdapter.operations.rootTypeFieldNames.read,
                graphqlDirectivesToCompose(propagatedDirectives)
            );

            complexityEstimatorHelper.registerField(
                "Query",
                interfaceEntityAdapter.operations.rootTypeFieldNames.connection
            );

            composer.Query.addFields({
                [interfaceEntityAdapter.operations.rootTypeFieldNames.connection]: rootConnectionResolver({
                    composer,
                    entityAdapter: interfaceEntityAdapter,
                    propagatedDirectives,
                    isLimitRequired: features?.limitRequired,
                    schemaModel,
                }),
            });
            composer.Query.setFieldDirectives(
                interfaceEntityAdapter.operations.rootTypeFieldNames.connection,
                graphqlDirectivesToCompose(propagatedDirectives)
            );
        }

        if (interfaceEntityAdapter.isAggregable(schemaModel)) {
            withAggregateSelectionType({
                entityAdapter: interfaceEntityAdapter,
                aggregationTypesMapper,
                propagatedDirectives,
                composer,
                features,
            });
        }
    }
}
