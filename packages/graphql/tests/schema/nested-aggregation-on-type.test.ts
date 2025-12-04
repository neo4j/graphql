import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql";
import { Neo4jGraphQL } from "../../src";

describe("nested aggregation on interface", () => {
    test("should generate the correct schema", async () => {
        const typeDefs = `
            type Movie @node {
                title: String!
                cost: Float!
                runtime: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
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
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { eq: ... } } }' instead.\\")
              screenTime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gt: ... } } }' instead.\\")
              screenTime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gte: ... } } }' instead.\\")
              screenTime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lt: ... } } }' instead.\\")
              screenTime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lte: ... } } }' instead.\\")
              screenTime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { eq: ... } } }' instead.\\")
              screenTime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gt: ... } } }' instead.\\")
              screenTime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gte: ... } } }' instead.\\")
              screenTime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lt: ... } } }' instead.\\")
              screenTime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lte: ... } } }' instead.\\")
              screenTime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { eq: ... } } }' instead.\\")
              screenTime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gt: ... } } }' instead.\\")
              screenTime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gte: ... } } }' instead.\\")
              screenTime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lt: ... } } }' instead.\\")
              screenTime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lte: ... } } }' instead.\\")
              screenTime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { eq: ... } } }' instead.\\")
              screenTime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gt: ... } } }' instead.\\")
              screenTime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gte: ... } } }' instead.\\")
              screenTime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lt: ... } } }' instead.\\")
              screenTime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { decrement: ... } }' instead.\\")
              screenTime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { increment: ... } }' instead.\\")
              screenTime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            type ActorActedInConnection {
              aggregate: ActorMovieActedInAggregateSelection!
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionAggregateInput {
              AND: [ActorActedInConnectionAggregateInput!]
              NOT: ActorActedInConnectionAggregateInput
              OR: [ActorActedInConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorActedInConnections
              \\"\\"\\"
              aggregate: ActorActedInConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              all: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              none: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              single: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              some: ActorActedInConnectionWhere
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
              node: MovieWhere
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
              cost: FloatScalarAggregationFilters
              cost_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { average: { eq: ... } } }' instead.\\")
              cost_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { average: { gt: ... } } }' instead.\\")
              cost_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { average: { gte: ... } } }' instead.\\")
              cost_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { average: { lt: ... } } }' instead.\\")
              cost_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { average: { lte: ... } } }' instead.\\")
              cost_MAX_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { max: { eq: ... } } }' instead.\\")
              cost_MAX_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { max: { gt: ... } } }' instead.\\")
              cost_MAX_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { max: { gte: ... } } }' instead.\\")
              cost_MAX_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { max: { lt: ... } } }' instead.\\")
              cost_MAX_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { max: { lte: ... } } }' instead.\\")
              cost_MIN_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { min: { eq: ... } } }' instead.\\")
              cost_MIN_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { min: { gt: ... } } }' instead.\\")
              cost_MIN_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { min: { gte: ... } } }' instead.\\")
              cost_MIN_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { min: { lt: ... } } }' instead.\\")
              cost_MIN_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { min: { lte: ... } } }' instead.\\")
              cost_SUM_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { sum: { eq: ... } } }' instead.\\")
              cost_SUM_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { sum: { gt: ... } } }' instead.\\")
              cost_SUM_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { sum: { gte: ... } } }' instead.\\")
              cost_SUM_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { sum: { lt: ... } } }' instead.\\")
              cost_SUM_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'cost: { sum: { lte: ... } } }' instead.\\")
              runtime: IntScalarAggregationFilters
              runtime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { eq: ... } } }' instead.\\")
              runtime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { gt: ... } } }' instead.\\")
              runtime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { gte: ... } } }' instead.\\")
              runtime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { lt: ... } } }' instead.\\")
              runtime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { average: { lte: ... } } }' instead.\\")
              runtime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { eq: ... } } }' instead.\\")
              runtime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { gt: ... } } }' instead.\\")
              runtime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { gte: ... } } }' instead.\\")
              runtime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { lt: ... } } }' instead.\\")
              runtime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { max: { lte: ... } } }' instead.\\")
              runtime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { eq: ... } } }' instead.\\")
              runtime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { gt: ... } } }' instead.\\")
              runtime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { gte: ... } } }' instead.\\")
              runtime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { lt: ... } } }' instead.\\")
              runtime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { min: { lte: ... } } }' instead.\\")
              runtime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { eq: ... } } }' instead.\\")
              runtime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { gt: ... } } }' instead.\\")
              runtime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { gte: ... } } }' instead.\\")
              runtime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { lt: ... } } }' instead.\\")
              runtime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'runtime: { sum: { lte: ... } } }' instead.\\")
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieActedInAggregateSelection {
              count: CountConnection!
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

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: MovieRelationshipFilters
              actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
              actedInConnection: ActorActedInConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              actedIn_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              actedIn_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              actedIn_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              actedIn_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
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

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            \\"\\"\\"Filters for an aggregation of a float field\\"\\"\\"
            input FloatScalarAggregationFilters {
              average: FloatScalarFilters
              max: FloatScalarFilters
              min: FloatScalarFilters
              sum: FloatScalarFilters
            }

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"Float mutations\\"\\"\\"
            input FloatScalarMutations {
              add: Float
              divide: Float
              multiply: Float
              set: Float
              subtract: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Movie {
              cost: Float!
              runtime: Int!
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              cost: FloatAggregateSelection!
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

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
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
              cost: FloatScalarMutations
              cost_ADD: Float @deprecated(reason: \\"Please use the relevant generic mutation 'cost: { add: ... } }' instead.\\")
              cost_DIVIDE: Float @deprecated(reason: \\"Please use the relevant generic mutation 'cost: { divide: ... } }' instead.\\")
              cost_MULTIPLY: Float @deprecated(reason: \\"Please use the relevant generic mutation 'cost: { multiply: ... } }' instead.\\")
              cost_SET: Float @deprecated(reason: \\"Please use the generic mutation 'cost: { set: ... } }' instead.\\")
              cost_SUBTRACT: Float @deprecated(reason: \\"Please use the relevant generic mutation 'cost: { subtract: ... } }' instead.\\")
              runtime: IntScalarMutations
              runtime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { decrement: ... } }' instead.\\")
              runtime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'runtime: { increment: ... } }' instead.\\")
              runtime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'runtime: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              cost: FloatScalarFilters
              cost_EQ: Float @deprecated(reason: \\"Please use the relevant generic filter cost: { eq: ... }\\")
              cost_GT: Float @deprecated(reason: \\"Please use the relevant generic filter cost: { gt: ... }\\")
              cost_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter cost: { gte: ... }\\")
              cost_IN: [Float!] @deprecated(reason: \\"Please use the relevant generic filter cost: { in: ... }\\")
              cost_LT: Float @deprecated(reason: \\"Please use the relevant generic filter cost: { lt: ... }\\")
              cost_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter cost: { lte: ... }\\")
              runtime: IntScalarFilters
              runtime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { eq: ... }\\")
              runtime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gt: ... }\\")
              runtime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { gte: ... }\\")
              runtime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter runtime: { in: ... }\\")
              runtime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lt: ... }\\")
              runtime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter runtime: { lte: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }"
        `);
    });
});
