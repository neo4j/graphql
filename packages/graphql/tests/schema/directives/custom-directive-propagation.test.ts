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
import { type InputObjectTypeDefinitionNode } from "graphql";

describe("custom directive propagation", () => {
    test("expect custom directives are propagated to the generated schema for Object, Interface, Field, Input Object, Input Field definitions", async () => {
        const typeDefs = /* GraphQL */ `
            directive @myCustomDirective on INPUT_FIELD_DEFINITION | INPUT_OBJECT | FIELD_DEFINITION | OBJECT | INTERFACE
            type MyObjectType @node @myCustomDirective {
                objectTypeField: String @myCustomDirective
            }
            input MyInput @myCustomDirective {
                inputTypeField: String @myCustomDirective
            }
            type Query {
                myQueryField(input: MyInput): MyObjectType @myCustomDirective # so GraphQL does not filter out the unused MyInput input type
            }
            interface MyInterface @myCustomDirective {
                interfaceTypeField: String @myCustomDirective
            }
            type MyImplementingObjectType implements MyInterface @node @myCustomDirective {
                interfaceTypeField: String @myCustomDirective
                objectTypeField: String @myCustomDirective
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

        // object type
        const myObjectType = schema.getType("MyObjectType");
        expect(myObjectType?.astNode?.directives).toHaveLength(1);
        expect(myObjectType?.astNode?.directives?.[0]?.name.value).toBe("myCustomDirective");

        const myObjectTypeFields = (myObjectType?.astNode as InputObjectTypeDefinitionNode).fields;
        expect(myObjectTypeFields).toHaveLength(1);
        for (const field of myObjectTypeFields || []) {
            expect(field.directives).toHaveLength(1);
            expect(field.directives?.[0]?.name.value).toBe("myCustomDirective");
        }

        const myImplementingObjectType = schema.getType("MyImplementingObjectType");
        expect(myImplementingObjectType?.astNode?.directives).toHaveLength(1);
        expect(myImplementingObjectType?.astNode?.directives?.[0]?.name.value).toBe("myCustomDirective");

        const myImplementingObjectTypeFields = (myImplementingObjectType?.astNode as InputObjectTypeDefinitionNode)
            .fields;
        expect(myImplementingObjectTypeFields).toHaveLength(2);
        for (const field of myImplementingObjectTypeFields || []) {
            expect(field.directives).toHaveLength(1);
            expect(field.directives?.[0]?.name.value).toBe("myCustomDirective");
        }

        // input type
        const myInputType = schema.getType("MyInput");
        expect(myInputType?.astNode?.directives).toHaveLength(1);
        expect(myInputType?.astNode?.directives?.[0]?.name.value).toBe("myCustomDirective");

        const myInputTypeFields = (myInputType?.astNode as InputObjectTypeDefinitionNode).fields;
        expect(myInputTypeFields).toHaveLength(1);
        for (const field of myInputTypeFields || []) {
            expect(field.directives).toHaveLength(1);
            expect(field.directives?.[0]?.name.value).toBe("myCustomDirective");
        }

        // interface type
        const myInterfaceType = schema.getType("MyInterface");
        expect(myInterfaceType?.astNode?.directives).toHaveLength(1);
        expect(myInterfaceType?.astNode?.directives?.[0]?.name.value).toBe("myCustomDirective");

        const myInterfaceTypeFields = (myInterfaceType?.astNode as InputObjectTypeDefinitionNode).fields;
        expect(myInterfaceTypeFields).toHaveLength(1);
        for (const field of myInterfaceTypeFields || []) {
            expect(field.directives).toHaveLength(1);
            expect(field.directives?.[0]?.name.value).toBe("myCustomDirective");
        }

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            directive @myCustomDirective on FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT

            type Count {
              nodes: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMyImplementingObjectTypesMutationResponse {
              info: CreateInfo!
              myImplementingObjectTypes: [MyImplementingObjectType!]!
            }

            type CreateMyObjectTypesMutationResponse {
              info: CreateInfo!
              myObjectTypes: [MyObjectType!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createMyImplementingObjectTypes(input: [MyImplementingObjectTypeCreateInput!]!): CreateMyImplementingObjectTypesMutationResponse!
              createMyObjectTypes(input: [MyObjectTypeCreateInput!]!): CreateMyObjectTypesMutationResponse!
              deleteMyImplementingObjectTypes(where: MyImplementingObjectTypeWhere): DeleteInfo!
              deleteMyObjectTypes(where: MyObjectTypeWhere): DeleteInfo!
              updateMyImplementingObjectTypes(update: MyImplementingObjectTypeUpdateInput, where: MyImplementingObjectTypeWhere): UpdateMyImplementingObjectTypesMutationResponse!
              updateMyObjectTypes(update: MyObjectTypeUpdateInput, where: MyObjectTypeWhere): UpdateMyObjectTypesMutationResponse!
            }

            type MyImplementingObjectType implements MyInterface @myCustomDirective {
              interfaceTypeField: String @myCustomDirective
              objectTypeField: String @myCustomDirective
            }

            type MyImplementingObjectTypeAggregate {
              count: Count!
              node: MyImplementingObjectTypeAggregateNode!
            }

            type MyImplementingObjectTypeAggregateNode {
              interfaceTypeField: StringAggregateSelection!
              objectTypeField: StringAggregateSelection!
            }

            input MyImplementingObjectTypeCreateInput {
              interfaceTypeField: String
              objectTypeField: String
            }

            type MyImplementingObjectTypeEdge {
              cursor: String!
              node: MyImplementingObjectType!
            }

            \\"\\"\\"
            Fields to sort MyImplementingObjectTypes by. The order in which sorts are applied is not guaranteed when specifying many fields in one MyImplementingObjectTypeSort object.
            \\"\\"\\"
            input MyImplementingObjectTypeSort {
              interfaceTypeField: SortDirection
              objectTypeField: SortDirection
            }

            input MyImplementingObjectTypeUpdateInput {
              interfaceTypeField: StringScalarMutations
              interfaceTypeField_SET: String
              objectTypeField: StringScalarMutations
              objectTypeField_SET: String
            }

            input MyImplementingObjectTypeWhere {
              AND: [MyImplementingObjectTypeWhere!]
              NOT: MyImplementingObjectTypeWhere
              OR: [MyImplementingObjectTypeWhere!]
              interfaceTypeField: StringScalarFilters
              interfaceTypeField_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { contains: ... }\\")
              interfaceTypeField_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { endsWith: ... }\\")
              interfaceTypeField_EQ: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { eq: ... }\\")
              interfaceTypeField_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { in: ... }\\")
              interfaceTypeField_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { startsWith: ... }\\")
              objectTypeField: StringScalarFilters
              objectTypeField_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { contains: ... }\\")
              objectTypeField_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { endsWith: ... }\\")
              objectTypeField_EQ: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { eq: ... }\\")
              objectTypeField_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { in: ... }\\")
              objectTypeField_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { startsWith: ... }\\")
            }

            type MyImplementingObjectTypesConnection {
              aggregate: MyImplementingObjectTypeAggregate!
              edges: [MyImplementingObjectTypeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MyInput @myCustomDirective {
              inputTypeField: String @myCustomDirective
            }

            interface MyInterface @myCustomDirective {
              interfaceTypeField: String @myCustomDirective
            }

            type MyInterfaceAggregate {
              count: Count!
              node: MyInterfaceAggregateNode!
            }

            type MyInterfaceAggregateNode {
              interfaceTypeField: StringAggregateSelection!
            }

            type MyInterfaceEdge {
              cursor: String!
              node: MyInterface!
            }

            enum MyInterfaceImplementation {
              MyImplementingObjectType
            }

            \\"\\"\\"
            Fields to sort MyInterfaces by. The order in which sorts are applied is not guaranteed when specifying many fields in one MyInterfaceSort object.
            \\"\\"\\"
            input MyInterfaceSort {
              interfaceTypeField: SortDirection
            }

            input MyInterfaceWhere {
              AND: [MyInterfaceWhere!]
              NOT: MyInterfaceWhere
              OR: [MyInterfaceWhere!]
              interfaceTypeField: StringScalarFilters
              interfaceTypeField_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { contains: ... }\\")
              interfaceTypeField_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { endsWith: ... }\\")
              interfaceTypeField_EQ: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { eq: ... }\\")
              interfaceTypeField_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { in: ... }\\")
              interfaceTypeField_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter interfaceTypeField: { startsWith: ... }\\")
              typename: [MyInterfaceImplementation!]
            }

            type MyInterfacesConnection {
              aggregate: MyInterfaceAggregate!
              edges: [MyInterfaceEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type MyObjectType @myCustomDirective {
              objectTypeField: String @myCustomDirective
            }

            type MyObjectTypeAggregate {
              count: Count!
              node: MyObjectTypeAggregateNode!
            }

            type MyObjectTypeAggregateNode {
              objectTypeField: StringAggregateSelection!
            }

            input MyObjectTypeCreateInput {
              objectTypeField: String
            }

            type MyObjectTypeEdge {
              cursor: String!
              node: MyObjectType!
            }

            \\"\\"\\"
            Fields to sort MyObjectTypes by. The order in which sorts are applied is not guaranteed when specifying many fields in one MyObjectTypeSort object.
            \\"\\"\\"
            input MyObjectTypeSort {
              objectTypeField: SortDirection
            }

            input MyObjectTypeUpdateInput {
              objectTypeField: StringScalarMutations
              objectTypeField_SET: String
            }

            input MyObjectTypeWhere {
              AND: [MyObjectTypeWhere!]
              NOT: MyObjectTypeWhere
              OR: [MyObjectTypeWhere!]
              objectTypeField: StringScalarFilters
              objectTypeField_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { contains: ... }\\")
              objectTypeField_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { endsWith: ... }\\")
              objectTypeField_EQ: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { eq: ... }\\")
              objectTypeField_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { in: ... }\\")
              objectTypeField_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter objectTypeField: { startsWith: ... }\\")
            }

            type MyObjectTypesConnection {
              aggregate: MyObjectTypeAggregate!
              edges: [MyObjectTypeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              myImplementingObjectTypes(limit: Int, offset: Int, sort: [MyImplementingObjectTypeSort!], where: MyImplementingObjectTypeWhere): [MyImplementingObjectType!]!
              myImplementingObjectTypesConnection(after: String, first: Int, sort: [MyImplementingObjectTypeSort!], where: MyImplementingObjectTypeWhere): MyImplementingObjectTypesConnection!
              myInterfaces(limit: Int, offset: Int, sort: [MyInterfaceSort!], where: MyInterfaceWhere): [MyInterface!]!
              myInterfacesConnection(after: String, first: Int, sort: [MyInterfaceSort!], where: MyInterfaceWhere): MyInterfacesConnection!
              myObjectTypes(limit: Int, offset: Int, sort: [MyObjectTypeSort!], where: MyObjectTypeWhere): [MyObjectType!]!
              myObjectTypesConnection(after: String, first: Int, sort: [MyObjectTypeSort!], where: MyObjectTypeWhere): MyObjectTypesConnection!
              myQueryField(input: MyInput): MyObjectType @myCustomDirective
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

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMyImplementingObjectTypesMutationResponse {
              info: UpdateInfo!
              myImplementingObjectTypes: [MyImplementingObjectType!]!
            }

            type UpdateMyObjectTypesMutationResponse {
              info: UpdateInfo!
              myObjectTypes: [MyObjectType!]!
            }"
        `);
    });

    test("expect types merge (override fields, keep relationship fields) if naming collisions occur between user-provided and auto-generated types", async () => {
        const typeDefs = /* GraphQL */ `
            directive @myOtherCustomDirective on INPUT_FIELD_DEFINITION | INPUT_OBJECT
            input MovieCreateInput
                @myOtherCustomDirective { # check directive propagated
                a: String @myOtherCustomDirective # check field added with directive propagated
                title: String! @myOtherCustomDirective # check directive propagated
                actors: String @myOtherCustomDirective # check field overridden with actual relationship field without directive
            }
            input ActedInCreateInput
                @myOtherCustomDirective { # check directive propagated
                a: Int! @myOtherCustomDirective # check field added with directive propagated
                screenTime: Int! @myOtherCustomDirective # check directive propagated
            }
            type Actor @node {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type Movie @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

        // relationship property input type
        const actedInCreateInput = schema.getType("ActedInCreateInput");
        expect(actedInCreateInput?.astNode?.directives).toHaveLength(1);
        expect(actedInCreateInput?.astNode?.directives?.[0]?.name.value).toBe("myOtherCustomDirective");

        const actedInCreateInputFields = (actedInCreateInput?.astNode as InputObjectTypeDefinitionNode).fields;
        expect(actedInCreateInputFields).toHaveLength(2);
        for (const field of actedInCreateInputFields || []) {
            expect(field.directives).toHaveLength(1);
            expect(field.directives?.[0]?.name.value).toBe("myOtherCustomDirective");
        }

        // object create input type
        const movieCreateInput = schema.getType("MovieCreateInput");
        expect(movieCreateInput?.astNode?.directives).toHaveLength(1);
        expect(movieCreateInput?.astNode?.directives?.[0]?.name.value).toBe("myOtherCustomDirective");

        const movieCreateInputFields = (movieCreateInput?.astNode as InputObjectTypeDefinitionNode).fields;
        expect(movieCreateInputFields).toHaveLength(3);
        for (const field of movieCreateInputFields || []) {
            if (field.name.value !== "actors") {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(field.directives).toHaveLength(1);
                // eslint-disable-next-line jest/no-conditional-expect
                expect(field.directives?.[0]?.name.value).toBe("myOtherCustomDirective");
            }
        }

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            directive @myOtherCustomDirective on INPUT_FIELD_DEFINITION | INPUT_OBJECT

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.actedIn
            * Movie.actors
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

            input ActedInCreateInput @myOtherCustomDirective {
              a: Int! @myOtherCustomDirective
              screenTime: Int! @myOtherCustomDirective
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
              connect: [MovieConnectInput!]
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
              delete: MovieDeleteInput
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              disconnect: MovieDisconnectInput
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

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
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

            type ActorMovieActedInAggregateSelection {
              count: CountConnection!
              edge: ActorMovieActedInEdgeAggregateSelection
              node: ActorMovieActedInNodeAggregateSelection
            }

            type ActorMovieActedInEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieActedInNodeAggregateSelection {
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
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
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              runtime: Int!
              title: String!
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
              aggregate: MovieActorActorsAggregateSelection!
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionAggregateInput {
              AND: [MovieActorsConnectionAggregateInput!]
              NOT: MovieActorsConnectionAggregateInput
              OR: [MovieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              all: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              none: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              single: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              some: MovieActorsConnectionWhere
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              node: ActorWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input MovieActorsDeleteFieldInput {
              delete: ActorDeleteInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
            }

            input MovieActorsNodeAggregationWhereInput {
              AND: [MovieActorsNodeAggregationWhereInput!]
              NOT: MovieActorsNodeAggregationWhereInput
              OR: [MovieActorsNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              runtime: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput @myOtherCustomDirective {
              a: String @myOtherCustomDirective
              actors: MovieActorsFieldInput
              title: String! @myOtherCustomDirective
            }

            input MovieDeleteInput {
              actors: [MovieActorsDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              actors: [MovieActorsDisconnectFieldInput!]
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
              runtime: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
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
              actors: ActorRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
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
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
