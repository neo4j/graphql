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

import {
    DirectiveLocation,
    GraphQLDirective,
    GraphQLEnumType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLString,
} from "graphql";

export const vectorProviderNames = {
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
                            // callback: {
                            //     description:
                            //         "The name of the callback function that will be used to populate the fields values.",
                            //     type: GraphQLString,
                            // },
                        },
                    })
                )
            ),
        },
    },
    locations: [DirectiveLocation.OBJECT],
});
