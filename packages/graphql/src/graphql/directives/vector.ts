/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import {
    DirectiveLocation,
    GraphQLDirective,
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLString,
} from "graphql";

const vectorProviderNames = {
    VERTEX_AI: "VertexAI",
    OPEN_AI: "OpenAI",
    AZURE_OPEN_AI: "AzureOpenAI",
    BEDROCK: "Bedrock",
} as const;

const VectorProviderEnum = new GraphQLEnumType({
    name: "VectorProvider",
    description: "*For use in the @vector directive only",
    values: Object.keys(vectorProviderNames).reduce((acc, key) => {
        acc[key] = { value: vectorProviderNames[key] };
        return acc;
    }, {}),
});

export const vectorDirective = new GraphQLDirective({
    name: "vector",
    description:
        "Informs @neo4j/graphql that there should be a vector index in the database, allows users to search by phrase in the generated schema.",
    args: {
        indexes: {
            type: new GraphQLNonNull(
                new GraphQLList(
                    new GraphQLInputObjectType({
                        name: "VectorInput",
                        fields: {
                            indexName: {
                                type: new GraphQLNonNull(GraphQLString),
                            },
                            embeddingProperty: {
                                type: new GraphQLNonNull(GraphQLString),
                            },
                            queryName: {
                                type: new GraphQLNonNull(GraphQLString),
                            },
                            provider: {
                                type: VectorProviderEnum,
                            },
                            maxPhraseLength: {
                                type: GraphQLInt,
                                description:
                                    "The maximum length, in characters, of the phrase argument accepted by queries against this index. Phrases longer than this are rejected before any database or embedding provider call is made.",
                            },
                        },
                    })
                )
            ),
        },
    },
    locations: [DirectiveLocation.OBJECT],
});
