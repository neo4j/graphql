import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql";
import { Neo4jGraphQL } from "../../src";

describe("nested aggregation on interface", () => {
    test("should generate the correct schema", async () => {
        const typeDefs = `
            type Movie {
                title: String!
                cost: Float!
                runtime: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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
            * Actor.actedIn
            \\"\\"\\"
            type ActedIn {
              screenTime: Int!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
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

            type Actor {
              actedIn(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActedInCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActedInWhere
              edge_NOT: ActedInWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            input ActorActedInNodeAggregationWhereInput {
              AND: [ActorActedInNodeAggregationWhereInput!]
              NOT: ActorActedInNodeAggregationWhereInput
              OR: [ActorActedInNodeAggregationWhereInput!]
              cost_AVERAGE_EQUAL: Float
              cost_AVERAGE_GT: Float
              cost_AVERAGE_GTE: Float
              cost_AVERAGE_LT: Float
              cost_AVERAGE_LTE: Float
              cost_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              cost_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              cost_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              cost_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              cost_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              cost_MAX_EQUAL: Float
              cost_MAX_GT: Float
              cost_MAX_GTE: Float
              cost_MAX_LT: Float
              cost_MAX_LTE: Float
              cost_MIN_EQUAL: Float
              cost_MIN_GT: Float
              cost_MIN_GTE: Float
              cost_MIN_LT: Float
              cost_MIN_LTE: Float
              cost_SUM_EQUAL: Float
              cost_SUM_GT: Float
              cost_SUM_GTE: Float
              cost_SUM_LT: Float
              cost_SUM_LTE: Float
              runtime_AVERAGE_EQUAL: Float
              runtime_AVERAGE_GT: Float
              runtime_AVERAGE_GTE: Float
              runtime_AVERAGE_LT: Float
              runtime_AVERAGE_LTE: Float
              runtime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              runtime_MAX_EQUAL: Int
              runtime_MAX_GT: Int
              runtime_MAX_GTE: Int
              runtime_MAX_LT: Int
              runtime_MAX_LTE: Int
              runtime_MIN_EQUAL: Int
              runtime_MIN_GT: Int
              runtime_MIN_GTE: Int
              runtime_MIN_LT: Int
              runtime_MIN_LTE: Int
              runtime_SUM_EQUAL: Int
              runtime_SUM_GT: Int
              runtime_SUM_GTE: Int
              runtime_SUM_LT: Int
              runtime_SUM_LTE: Int
              title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
              title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
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
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
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

            type ActorMovieActedInAggregationSelection {
              count: Int!
              edge: ActorMovieActedInEdgeAggregateSelection
              node: ActorMovieActedInNodeAggregateSelection
            }

            type ActorMovieActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieActedInNodeAggregateSelection {
              cost: FloatAggregateSelection!
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: MovieWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
              actedInAggregate: ActorActedInAggregateInput
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
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              actedIn_ALL: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              actedIn_NONE: MovieWhere
              actedIn_NOT: MovieWhere @deprecated(reason: \\"Use \`actedIn_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              actedIn_SINGLE: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              actedIn_SOME: MovieWhere
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

            type CreateActorsMutationResponse {
              actors: [Actor!]!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie {
              cost: Float!
              runtime: Int!
              title: String!
            }

            type MovieAggregateSelection {
              cost: FloatAggregateSelection!
              count: Int!
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              cost: Float!
              runtime: Int!
              title: String!
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

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              cost: SortDirection
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              cost: Float
              cost_ADD: Float
              cost_DIVIDE: Float
              cost_MULTIPLY: Float
              cost_SUBTRACT: Float
              runtime: Int
              runtime_DECREMENT: Int
              runtime_INCREMENT: Int
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              cost: Float
              cost_GT: Float
              cost_GTE: Float
              cost_IN: [Float!]
              cost_LT: Float
              cost_LTE: Float
              cost_NOT: Float @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              cost_NOT_IN: [Float!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }"
        `);
    });
});
