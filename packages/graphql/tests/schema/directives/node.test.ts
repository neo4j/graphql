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

import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("@node", () => {
    test("when @node is not applied it should not be considered for schema augmentation", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String
            }
            ## Movie should not be considered for schema augmentation
            type Movie implements Production {
                id: ID
            }
            ## Production should not be considered for schema augmentation as it has no implemented nodes.
            interface Production {
                id: ID
            }

            type Query {
                movie: Movie @cypher(statement: "RETURN { id: '1' } as movie", columnName: "movie")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              name: String
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              id: ID
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movie: Movie
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }"
        `);
    });

    test.only("test", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String
            }

            ## Production should not be considered for schema augmentation as it has no implemented nodes.
            interface Production {
                id: ID
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
          "schema {
            query: Query
            mutation: Mutation
          }

          type Actor {
            name: String
          }

          type ActorAggregateSelection {
            count: Int!
            name: StringAggregateSelection!
          }

          input ActorCreateInput {
            name: String
          }

          type ActorEdge {
            cursor: String!
            node: Actor!
          }

          input ActorOptions {
            limit: Int
            offset: Int
            \\"\\"\\"
            Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
            \\"\\"\\"
            sort: [ActorSort!]
          }

          \\"\\"\\"
          Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
          \\"\\"\\"
          input ActorSort {
            name: SortDirection
          }

          input ActorUpdateInput {
            name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
            name_SET: String
          }

          input ActorWhere {
            AND: [ActorWhere!]
            NOT: ActorWhere
            OR: [ActorWhere!]
            name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
            name_CONTAINS: String
            name_ENDS_WITH: String
            name_EQ: String
            name_IN: [String]
            name_STARTS_WITH: String
          }

          type ActorsConnection {
            edges: [ActorEdge!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          type CreateActorsMutationResponse {
            actors: [Actor!]!
            info: CreateInfo!
          }

          \\"\\"\\"
          Information about the number of nodes and relationships created during a create mutation
          \\"\\"\\"
          type CreateInfo {
            nodesCreated: Int!
            relationshipsCreated: Int!
          }

          \\"\\"\\"
          Information about the number of nodes and relationships deleted during a delete mutation
          \\"\\"\\"
          type DeleteInfo {
            nodesDeleted: Int!
            relationshipsDeleted: Int!
          }

          type Movie {
            id: ID
          }

          type Mutation {
            createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
            deleteActors(where: ActorWhere): DeleteInfo!
            updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
          }

          \\"\\"\\"Pagination information (Relay)\\"\\"\\"
          type PageInfo {
            endCursor: String
            hasNextPage: Boolean!
            hasPreviousPage: Boolean!
            startCursor: String
          }

          type Query {
            actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
            actorsAggregate(where: ActorWhere): ActorAggregateSelection!
            actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
            movie: Movie
          }

          \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
          enum SortDirection {
            \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
            ASC
            \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
            DESC
          }

          type StringAggregateSelection {
            longest: String
            shortest: String
          }

          type UpdateActorsMutationResponse {
            actors: [Actor!]!
            info: UpdateInfo!
          }

          \\"\\"\\"
          Information about the number of nodes and relationships created and deleted during an update mutation
          \\"\\"\\"
          type UpdateInfo {
            nodesCreated: Int!
            nodesDeleted: Int!
            relationshipsCreated: Int!
            relationshipsDeleted: Int!
          }"
      `);
    });
});
