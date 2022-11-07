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

import { buildSubgraphSchema } from "@apollo/subgraph";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { GraphQLSchema, parse } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQLApolloFederationPlugin } from "../../../src";
import { GraphQLResolverMap } from "apollo-graphql";

export const typeDefs = gql`
    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

    type Location @key(fields: "id") {
        id: ID!
        "The name of the location"
        name: String!
        "A short description about the location"
        description: String!
        "The location's main photo as a URL"
        photo: String!
    }
`;

export async function getSchema(): Promise<GraphQLSchema> {
    const plugin = new Neo4jGraphQLApolloFederationPlugin(typeDefs);

    // @ts-ignore: not public yet
    const neo4jGraphQL = new Neo4jGraphQL({ typeDefs, plugins: { federation: plugin } });

    const schemaDefinition = await neo4jGraphQL.getSchemaDefinition();
    const schema = buildSubgraphSchema({
        typeDefs: parse(schemaDefinition.typeDefs),
        resolvers: schemaDefinition.resolvers,
    });

    return schema;
}
