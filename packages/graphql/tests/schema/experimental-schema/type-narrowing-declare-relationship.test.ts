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
import { NamedTypeNode, NonNullTypeNode, ObjectTypeDefinitionNode } from "graphql";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("Declare Relationship", () => {
    test("www", async () => {
        const typeDefs = gql`
            interface Production {
                title: String!
                actors: [Person!]! @declareRelationship
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type AmatureProduction implements Production {
                title: String!
                episodeCount: Int!
                actors: [UntrainedPerson!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type AppearsIn @relationshipProperties {
                sceneNr: Int!
            }

            interface Person {
                name: String!
            }

            type Actor implements Person {
                name: String!
                moviesCnt: Int!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type UntrainedPerson implements Person {
                name: String!
                age: Int!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "AppearsIn")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actors
            * AmatureProduction.actors
            * Actor.actedIn
            \\"\\"\\"
            type ActedIn {
              screenTime: Int!
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: Int
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int!]
              screenTime_LT: Int
              screenTime_LTE: Int
              screenTime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              screenTime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type Actor implements Person {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInAggregate(directed: Boolean = true, where: ProductionWhere): ActorProductionActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              moviesCnt: Int!
              name: String!
            }

            input ActorActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActedInCreateInput!
              where: ProductionConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: ProductionSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: ProductionCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ProductionUpdateInput
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
              where: ActorActedInConnectionWhere
            }

            type ActorAggregateSelection {
              count: Int!
              moviesCnt: IntAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              moviesCnt: Int!
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
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

            type ActorProductionActedInAggregationSelection {
              count: Int!
              edge: ActorProductionActedInEdgeAggregateSelection
              node: ActorProductionActedInNodeAggregateSelection
            }

            type ActorProductionActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelectionNonNullable!
            }

            type ActorProductionActedInNodeAggregateSelection {
              title: StringAggregateSelectionNonNullable!
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              moviesCnt: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              moviesCnt: Int
              moviesCnt_DECREMENT: Int
              moviesCnt_INCREMENT: Int
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere
              moviesCnt: Int
              moviesCnt_GT: Int
              moviesCnt_GTE: Int
              moviesCnt_IN: [Int!]
              moviesCnt_LT: Int
              moviesCnt_LTE: Int
              moviesCnt_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              moviesCnt_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type AmatureProduction implements Production {
              actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [UntrainedPerson!]!
              actorsAggregate(directed: Boolean = true, where: UntrainedPersonWhere): AmatureProductionUntrainedPersonActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              episodeCount: Int!
              title: String!
            }

            input AmatureProductionActorsAggregateInput {
              AND: [AmatureProductionActorsAggregateInput!]
              NOT: AmatureProductionActorsAggregateInput
              OR: [AmatureProductionActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: AmatureProductionActorsEdgeAggregationWhereInput
              node: AmatureProductionActorsNodeAggregationWhereInput
            }

            input AmatureProductionActorsConnectFieldInput {
              connect: [UntrainedPersonConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UntrainedPersonConnectWhere
            }

            input AmatureProductionActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: UntrainedPersonCreateInput!
            }

            input AmatureProductionActorsEdgeAggregationWhereInput {
              AND: [AmatureProductionActorsEdgeAggregationWhereInput!]
              NOT: AmatureProductionActorsEdgeAggregationWhereInput
              OR: [AmatureProductionActorsEdgeAggregationWhereInput!]
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_MAX_EQUAL: Int
              screenTime_MAX_GT: Int
              screenTime_MAX_GTE: Int
              screenTime_MAX_LT: Int
              screenTime_MAX_LTE: Int
              screenTime_MIN_EQUAL: Int
              screenTime_MIN_GT: Int
              screenTime_MIN_GTE: Int
              screenTime_MIN_LT: Int
              screenTime_MIN_LTE: Int
              screenTime_SUM_EQUAL: Int
              screenTime_SUM_GT: Int
              screenTime_SUM_GTE: Int
              screenTime_SUM_LT: Int
              screenTime_SUM_LTE: Int
            }

            input AmatureProductionActorsFieldInput {
              connect: [AmatureProductionActorsConnectFieldInput!]
              create: [AmatureProductionActorsCreateFieldInput!]
            }

            input AmatureProductionActorsNodeAggregationWhereInput {
              AND: [AmatureProductionActorsNodeAggregationWhereInput!]
              NOT: AmatureProductionActorsNodeAggregationWhereInput
              OR: [AmatureProductionActorsNodeAggregationWhereInput!]
              age_AVERAGE_EQUAL: Float
              age_AVERAGE_GT: Float
              age_AVERAGE_GTE: Float
              age_AVERAGE_LT: Float
              age_AVERAGE_LTE: Float
              age_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              age_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              age_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              age_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              age_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              age_MAX_EQUAL: Int
              age_MAX_GT: Int
              age_MAX_GTE: Int
              age_MAX_LT: Int
              age_MAX_LTE: Int
              age_MIN_EQUAL: Int
              age_MIN_GT: Int
              age_MIN_GTE: Int
              age_MIN_LT: Int
              age_MIN_LTE: Int
              age_SUM_EQUAL: Int
              age_SUM_GT: Int
              age_SUM_GTE: Int
              age_SUM_LT: Int
              age_SUM_LTE: Int
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input AmatureProductionActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: UntrainedPersonUpdateInput
            }

            input AmatureProductionActorsUpdateFieldInput {
              connect: [AmatureProductionActorsConnectFieldInput!]
              create: [AmatureProductionActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: AmatureProductionActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            type AmatureProductionAggregateSelection {
              count: Int!
              episodeCount: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input AmatureProductionConnectInput {
              actors: [AmatureProductionActorsConnectFieldInput!]
            }

            input AmatureProductionCreateInput {
              actors: AmatureProductionActorsFieldInput
              episodeCount: Int!
              title: String!
            }

            input AmatureProductionDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input AmatureProductionDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
            }

            type AmatureProductionEdge {
              cursor: String!
              node: AmatureProduction!
            }

            input AmatureProductionOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more AmatureProductionSort objects to sort AmatureProductions by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [AmatureProductionSort!]
            }

            input AmatureProductionRelationInput {
              actors: [AmatureProductionActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort AmatureProductions by. The order in which sorts are applied is not guaranteed when specifying many fields in one AmatureProductionSort object.
            \\"\\"\\"
            input AmatureProductionSort {
              episodeCount: SortDirection
              title: SortDirection
            }

            type AmatureProductionUntrainedPersonActorsAggregationSelection {
              count: Int!
              edge: AmatureProductionUntrainedPersonActorsEdgeAggregateSelection
              node: AmatureProductionUntrainedPersonActorsNodeAggregateSelection
            }

            type AmatureProductionUntrainedPersonActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelectionNonNullable!
            }

            type AmatureProductionUntrainedPersonActorsNodeAggregateSelection {
              age: IntAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input AmatureProductionUpdateInput {
              actors: [AmatureProductionActorsUpdateFieldInput!]
              episodeCount: Int
              episodeCount_DECREMENT: Int
              episodeCount_INCREMENT: Int
              title: String
            }

            input AmatureProductionWhere {
              AND: [AmatureProductionWhere!]
              NOT: AmatureProductionWhere
              OR: [AmatureProductionWhere!]
              actors: UntrainedPersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: AmatureProductionActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return AmatureProductions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return AmatureProductions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return AmatureProductions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return AmatureProductions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return AmatureProductions where all of the related UntrainedPeople match this filter
              \\"\\"\\"
              actors_ALL: UntrainedPersonWhere
              \\"\\"\\"
              Return AmatureProductions where none of the related UntrainedPeople match this filter
              \\"\\"\\"
              actors_NONE: UntrainedPersonWhere
              actors_NOT: UntrainedPersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"
              Return AmatureProductions where one of the related UntrainedPeople match this filter
              \\"\\"\\"
              actors_SINGLE: UntrainedPersonWhere
              \\"\\"\\"
              Return AmatureProductions where some of the related UntrainedPeople match this filter
              \\"\\"\\"
              actors_SOME: UntrainedPersonWhere
              episodeCount: Int
              episodeCount_GT: Int
              episodeCount_GTE: Int
              episodeCount_IN: [Int!]
              episodeCount_LT: Int
              episodeCount_LTE: Int
              episodeCount_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episodeCount_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
            }

            type AmatureProductionsConnection {
              edges: [AmatureProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * UntrainedPerson.actedIn
            \\"\\"\\"
            type AppearsIn {
              sceneNr: Int!
            }

            input AppearsInCreateInput {
              sceneNr: Int!
            }

            input AppearsInSort {
              sceneNr: SortDirection
            }

            input AppearsInUpdateInput {
              sceneNr: Int
              sceneNr_DECREMENT: Int
              sceneNr_INCREMENT: Int
            }

            input AppearsInWhere {
              AND: [AppearsInWhere!]
              NOT: AppearsInWhere
              OR: [AppearsInWhere!]
              sceneNr: Int
              sceneNr_GT: Int
              sceneNr_GTE: Int
              sceneNr_IN: [Int!]
              sceneNr_LT: Int
              sceneNr_LTE: Int
              sceneNr_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              sceneNr_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            type CreateAmatureProductionsMutationResponse {
              amatureProductions: [AmatureProduction!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreateUntrainedPeopleMutationResponse {
              info: CreateInfo!
              untrainedPeople: [UntrainedPerson!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IntAggregateSelectionNonNullable {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelectionNonNullable!
            }

            type MovieActorActorsNodeAggregateSelection {
              moviesCnt: IntAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: MovieActorsEdgeAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ActorConnectWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input MovieActorsEdgeAggregationWhereInput {
              AND: [MovieActorsEdgeAggregationWhereInput!]
              NOT: MovieActorsEdgeAggregationWhereInput
              OR: [MovieActorsEdgeAggregationWhereInput!]
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_MAX_EQUAL: Int
              screenTime_MAX_GT: Int
              screenTime_MAX_GTE: Int
              screenTime_MAX_LT: Int
              screenTime_MAX_LTE: Int
              screenTime_MIN_EQUAL: Int
              screenTime_MIN_GT: Int
              screenTime_MIN_GTE: Int
              screenTime_MIN_LT: Int
              screenTime_MIN_LTE: Int
              screenTime_SUM_EQUAL: Int
              screenTime_SUM_GT: Int
              screenTime_SUM_GTE: Int
              screenTime_SUM_LT: Int
              screenTime_SUM_LTE: Int
            }

            input MovieActorsFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
            }

            input MovieActorsNodeAggregationWhereInput {
              AND: [MovieActorsNodeAggregationWhereInput!]
              NOT: MovieActorsNodeAggregationWhereInput
              OR: [MovieActorsNodeAggregationWhereInput!]
              moviesCnt_AVERAGE_EQUAL: Float
              moviesCnt_AVERAGE_GT: Float
              moviesCnt_AVERAGE_GTE: Float
              moviesCnt_AVERAGE_LT: Float
              moviesCnt_AVERAGE_LTE: Float
              moviesCnt_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              moviesCnt_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              moviesCnt_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              moviesCnt_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              moviesCnt_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              moviesCnt_MAX_EQUAL: Int
              moviesCnt_MAX_GT: Int
              moviesCnt_MAX_GTE: Int
              moviesCnt_MAX_LT: Int
              moviesCnt_MAX_LTE: Int
              moviesCnt_MIN_EQUAL: Int
              moviesCnt_MIN_GT: Int
              moviesCnt_MIN_GTE: Int
              moviesCnt_MIN_LT: Int
              moviesCnt_MIN_LTE: Int
              moviesCnt_SUM_EQUAL: Int
              moviesCnt_SUM_GT: Int
              moviesCnt_SUM_GTE: Int
              moviesCnt_SUM_LT: Int
              moviesCnt_SUM_LTE: Int
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            type MovieAggregateSelection {
              count: Int!
              runtime: IntAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              runtime: Int!
              title: String!
            }

            input MovieDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            input MovieRelationInput {
              actors: [MovieActorsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere
              runtime: Int
              runtime_GT: Int
              runtime_GTE: Int
              runtime_IN: [Int!]
              runtime_LT: Int
              runtime_LTE: Int
              runtime_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              runtime_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createAmatureProductions(input: [AmatureProductionCreateInput!]!): CreateAmatureProductionsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createUntrainedPeople(input: [UntrainedPersonCreateInput!]!): CreateUntrainedPeopleMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteAmatureProductions(delete: AmatureProductionDeleteInput, where: AmatureProductionWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteUntrainedPeople(delete: UntrainedPersonDeleteInput, where: UntrainedPersonWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateAmatureProductions(connect: AmatureProductionConnectInput, create: AmatureProductionRelationInput, delete: AmatureProductionDeleteInput, disconnect: AmatureProductionDisconnectInput, update: AmatureProductionUpdateInput, where: AmatureProductionWhere): UpdateAmatureProductionsMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateUntrainedPeople(connect: UntrainedPersonConnectInput, create: UntrainedPersonRelationInput, delete: UntrainedPersonDeleteInput, disconnect: UntrainedPersonDisconnectInput, update: UntrainedPersonUpdateInput, where: UntrainedPersonWhere): UpdateUntrainedPeopleMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            interface Person {
              name: String!
            }

            type PersonAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              Actor: ActorCreateInput
              UntrainedPerson: UntrainedPersonCreateInput
            }

            enum PersonImplementation {
              Actor
              UntrainedPerson
            }

            input PersonOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PersonSort]
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              name: String
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              typename_IN: [PersonImplementation!]
            }

            interface Production {
              actors(options: PersonOptions, where: PersonWhere): [Person!]!
              actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
              title: String!
            }

            input ProductionActorsConnectFieldInput {
              edge: ProductionActorsEdgeCreateInput!
              where: PersonConnectWhere
            }

            type ProductionActorsConnection {
              edges: [ProductionActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorsConnectionSort {
              edge: ProductionActorsEdgeSort
              node: PersonSort
            }

            input ProductionActorsConnectionWhere {
              AND: [ProductionActorsConnectionWhere!]
              NOT: ProductionActorsConnectionWhere
              OR: [ProductionActorsConnectionWhere!]
              edge: ProductionActorsEdgeWhere
              edge_NOT: ProductionActorsEdgeWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: PersonWhere
              node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ProductionActorsCreateFieldInput {
              edge: ProductionActorsEdgeCreateInput!
              node: PersonCreateInput!
            }

            input ProductionActorsDeleteFieldInput {
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsDisconnectFieldInput {
              where: ProductionActorsConnectionWhere
            }

            input ProductionActorsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * AmatureProduction
              \\"\\"\\"
              ActedIn: ActedInCreateInput!
            }

            input ProductionActorsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * AmatureProduction
              \\"\\"\\"
              ActedIn: ActedInSort
            }

            input ProductionActorsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * AmatureProduction
              \\"\\"\\"
              ActedIn: ActedInUpdateInput
            }

            input ProductionActorsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * AmatureProduction
              \\"\\"\\"
              ActedIn: ActedInWhere
            }

            type ProductionActorsRelationship {
              cursor: String!
              node: Person!
              properties: ProductionActorsRelationshipProperties!
            }

            union ProductionActorsRelationshipProperties = ActedIn

            input ProductionActorsUpdateConnectionInput {
              edge: ProductionActorsEdgeUpdateInput
              node: PersonUpdateInput
            }

            input ProductionActorsUpdateFieldInput {
              connect: [ProductionActorsConnectFieldInput!]
              create: [ProductionActorsCreateFieldInput!]
              delete: [ProductionActorsDeleteFieldInput!]
              disconnect: [ProductionActorsDisconnectFieldInput!]
              update: ProductionActorsUpdateConnectionInput
              where: ProductionActorsConnectionWhere
            }

            type ProductionAggregateSelection {
              count: Int!
              title: StringAggregateSelectionNonNullable!
            }

            input ProductionConnectInput {
              actors: [ProductionActorsConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              AmatureProduction: AmatureProductionCreateInput
              Movie: MovieCreateInput
            }

            input ProductionDeleteInput {
              actors: [ProductionActorsDeleteFieldInput!]
            }

            input ProductionDisconnectInput {
              actors: [ProductionActorsDisconnectFieldInput!]
            }

            enum ProductionImplementation {
              AmatureProduction
              Movie
            }

            input ProductionOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ProductionSort objects to sort Productions by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ProductionSort]
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionUpdateInput {
              actors: [ProductionActorsUpdateFieldInput!]
              title: String
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actorsConnection: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Productions where all of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: ProductionActorsConnectionWhere
              actorsConnection_NOT: ProductionActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: ProductionActorsConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: ProductionActorsConnectionWhere
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_STARTS_WITH: String
              typename_IN: [ProductionImplementation!]
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              amatureProductions(options: AmatureProductionOptions, where: AmatureProductionWhere): [AmatureProduction!]!
              amatureProductionsAggregate(where: AmatureProductionWhere): AmatureProductionAggregateSelection!
              amatureProductionsConnection(after: String, first: Int, sort: [AmatureProductionSort], where: AmatureProductionWhere): AmatureProductionsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              untrainedPeople(options: UntrainedPersonOptions, where: UntrainedPersonWhere): [UntrainedPerson!]!
              untrainedPeopleAggregate(where: UntrainedPersonWhere): UntrainedPersonAggregateSelection!
              untrainedPeopleConnection(after: String, first: Int, sort: [UntrainedPersonSort], where: UntrainedPersonWhere): UntrainedPeopleConnection!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNonNullable {
              longest: String
              shortest: String
            }

            type UntrainedPeopleConnection {
              edges: [UntrainedPersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type UntrainedPerson implements Person {
              actedIn(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): [Production!]!
              actedInAggregate(directed: Boolean = true, where: ProductionWhere): UntrainedPersonProductionActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [UntrainedPersonActedInConnectionSort!], where: UntrainedPersonActedInConnectionWhere): UntrainedPersonActedInConnection!
              age: Int!
              name: String!
            }

            input UntrainedPersonActedInConnectFieldInput {
              connect: ProductionConnectInput
              edge: AppearsInCreateInput!
              where: ProductionConnectWhere
            }

            type UntrainedPersonActedInConnection {
              edges: [UntrainedPersonActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UntrainedPersonActedInConnectionSort {
              edge: AppearsInSort
              node: ProductionSort
            }

            input UntrainedPersonActedInConnectionWhere {
              AND: [UntrainedPersonActedInConnectionWhere!]
              NOT: UntrainedPersonActedInConnectionWhere
              OR: [UntrainedPersonActedInConnectionWhere!]
              edge: AppearsInWhere
              edge_NOT: AppearsInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input UntrainedPersonActedInCreateFieldInput {
              edge: AppearsInCreateInput!
              node: ProductionCreateInput!
            }

            input UntrainedPersonActedInDeleteFieldInput {
              delete: ProductionDeleteInput
              where: UntrainedPersonActedInConnectionWhere
            }

            input UntrainedPersonActedInDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: UntrainedPersonActedInConnectionWhere
            }

            input UntrainedPersonActedInFieldInput {
              connect: [UntrainedPersonActedInConnectFieldInput!]
              create: [UntrainedPersonActedInCreateFieldInput!]
            }

            type UntrainedPersonActedInRelationship {
              cursor: String!
              node: Production!
              properties: AppearsIn!
            }

            input UntrainedPersonActedInUpdateConnectionInput {
              edge: AppearsInUpdateInput
              node: ProductionUpdateInput
            }

            input UntrainedPersonActedInUpdateFieldInput {
              connect: [UntrainedPersonActedInConnectFieldInput!]
              create: [UntrainedPersonActedInCreateFieldInput!]
              delete: [UntrainedPersonActedInDeleteFieldInput!]
              disconnect: [UntrainedPersonActedInDisconnectFieldInput!]
              update: UntrainedPersonActedInUpdateConnectionInput
              where: UntrainedPersonActedInConnectionWhere
            }

            type UntrainedPersonAggregateSelection {
              age: IntAggregateSelectionNonNullable!
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input UntrainedPersonConnectInput {
              actedIn: [UntrainedPersonActedInConnectFieldInput!]
            }

            input UntrainedPersonConnectWhere {
              node: UntrainedPersonWhere!
            }

            input UntrainedPersonCreateInput {
              actedIn: UntrainedPersonActedInFieldInput
              age: Int!
              name: String!
            }

            input UntrainedPersonDeleteInput {
              actedIn: [UntrainedPersonActedInDeleteFieldInput!]
            }

            input UntrainedPersonDisconnectInput {
              actedIn: [UntrainedPersonActedInDisconnectFieldInput!]
            }

            type UntrainedPersonEdge {
              cursor: String!
              node: UntrainedPerson!
            }

            input UntrainedPersonOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UntrainedPersonSort objects to sort UntrainedPeople by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UntrainedPersonSort!]
            }

            type UntrainedPersonProductionActedInAggregationSelection {
              count: Int!
              edge: UntrainedPersonProductionActedInEdgeAggregateSelection
              node: UntrainedPersonProductionActedInNodeAggregateSelection
            }

            type UntrainedPersonProductionActedInEdgeAggregateSelection {
              sceneNr: IntAggregateSelectionNonNullable!
            }

            type UntrainedPersonProductionActedInNodeAggregateSelection {
              title: StringAggregateSelectionNonNullable!
            }

            input UntrainedPersonRelationInput {
              actedIn: [UntrainedPersonActedInCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort UntrainedPeople by. The order in which sorts are applied is not guaranteed when specifying many fields in one UntrainedPersonSort object.
            \\"\\"\\"
            input UntrainedPersonSort {
              age: SortDirection
              name: SortDirection
            }

            input UntrainedPersonUpdateInput {
              actedIn: [UntrainedPersonActedInUpdateFieldInput!]
              age: Int
              age_DECREMENT: Int
              age_INCREMENT: Int
              name: String
            }

            input UntrainedPersonWhere {
              AND: [UntrainedPersonWhere!]
              NOT: UntrainedPersonWhere
              OR: [UntrainedPersonWhere!]
              actedInConnection: UntrainedPersonActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return UntrainedPeople where all of the related UntrainedPersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: UntrainedPersonActedInConnectionWhere
              \\"\\"\\"
              Return UntrainedPeople where none of the related UntrainedPersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: UntrainedPersonActedInConnectionWhere
              actedInConnection_NOT: UntrainedPersonActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return UntrainedPeople where one of the related UntrainedPersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: UntrainedPersonActedInConnectionWhere
              \\"\\"\\"
              Return UntrainedPeople where some of the related UntrainedPersonActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: UntrainedPersonActedInConnectionWhere
              age: Int
              age_GT: Int
              age_GTE: Int
              age_IN: [Int!]
              age_LT: Int
              age_LTE: Int
              age_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              age_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            type UpdateAmatureProductionsMutationResponse {
              amatureProductions: [AmatureProduction!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdateUntrainedPeopleMutationResponse {
              info: UpdateInfo!
              untrainedPeople: [UntrainedPerson!]!
            }"
        `);
    });
});
