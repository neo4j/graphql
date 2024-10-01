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
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("Plural option", () => {
    test("Partial types with plural", async () => {
        const typeDefs = gql`
            type Tech @plural(value: "Techs") @node {
                name: String
            }

            type Tech @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTechsMutationResponse {
              info: CreateInfo!
              techs: [Tech!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createTechs(input: [TechCreateInput!]!): CreateTechsMutationResponse!
              deleteTechs(where: TechWhere): DeleteInfo!
              updateTechs(update: TechUpdateInput, where: TechWhere): UpdateTechsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              techs(limit: Int, offset: Int, options: TechOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [TechSort!], where: TechWhere): [Tech!]!
              techsAggregate(where: TechWhere): TechAggregateSelection!
              techsConnection(after: String, first: Int, sort: [TechSort], where: TechWhere): TechsConnection!
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

            type Tech {
              name: String
              value: String
            }

            type TechAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
              value: StringAggregateSelection!
            }

            input TechCreateInput {
              name: String
              value: String
            }

            type TechEdge {
              cursor: String!
              node: Tech!
            }

            input TechOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more TechSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [TechSort!]
            }

            \\"\\"\\"
            Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechSort object.
            \\"\\"\\"
            input TechSort {
              name: SortDirection
              value: SortDirection
            }

            input TechUpdateInput {
              name: String
              value: String
            }

            input TechWhere {
              AND: [TechWhere!]
              NOT: TechWhere
              OR: [TechWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }

            type TechsConnection {
              edges: [TechEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateTechsMutationResponse {
              info: UpdateInfo!
              techs: [Tech!]!
            }"
        `);
    });

    test("Partial types with same plural in both", async () => {
        const typeDefs = gql`
            type Tech @plural(value: "Techs") @node {
                name: String
            }

            type Tech @plural(value: "Techs") @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTechsMutationResponse {
              info: CreateInfo!
              techs: [Tech!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createTechs(input: [TechCreateInput!]!): CreateTechsMutationResponse!
              deleteTechs(where: TechWhere): DeleteInfo!
              updateTechs(update: TechUpdateInput, where: TechWhere): UpdateTechsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              techs(limit: Int, offset: Int, options: TechOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [TechSort!], where: TechWhere): [Tech!]!
              techsAggregate(where: TechWhere): TechAggregateSelection!
              techsConnection(after: String, first: Int, sort: [TechSort], where: TechWhere): TechsConnection!
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

            type Tech {
              name: String
              value: String
            }

            type TechAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
              value: StringAggregateSelection!
            }

            input TechCreateInput {
              name: String
              value: String
            }

            type TechEdge {
              cursor: String!
              node: Tech!
            }

            input TechOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more TechSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [TechSort!]
            }

            \\"\\"\\"
            Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechSort object.
            \\"\\"\\"
            input TechSort {
              name: SortDirection
              value: SortDirection
            }

            input TechUpdateInput {
              name: String
              value: String
            }

            input TechWhere {
              AND: [TechWhere!]
              NOT: TechWhere
              OR: [TechWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }

            type TechsConnection {
              edges: [TechEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateTechsMutationResponse {
              info: UpdateInfo!
              techs: [Tech!]!
            }"
        `);
    });

    test("Partial types with different plural", async () => {
        const typeDefs = gql`
            type Tech @plural(value: "Techs") @node {
                name: String
            }

            type Tech @plural(value: "Technologies") @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTechnologiesMutationResponse {
              info: CreateInfo!
              technologies: [Tech!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createTechnologies(input: [TechCreateInput!]!): CreateTechnologiesMutationResponse!
              deleteTechnologies(where: TechWhere): DeleteInfo!
              updateTechnologies(update: TechUpdateInput, where: TechWhere): UpdateTechnologiesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              technologies(limit: Int, offset: Int, options: TechOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [TechSort!], where: TechWhere): [Tech!]!
              technologiesAggregate(where: TechWhere): TechAggregateSelection!
              technologiesConnection(after: String, first: Int, sort: [TechSort], where: TechWhere): TechnologiesConnection!
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

            type Tech {
              name: String
              value: String
            }

            type TechAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
              value: StringAggregateSelection!
            }

            input TechCreateInput {
              name: String
              value: String
            }

            type TechEdge {
              cursor: String!
              node: Tech!
            }

            input TechOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more TechSort objects to sort Technologies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [TechSort!]
            }

            \\"\\"\\"
            Fields to sort Technologies by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechSort object.
            \\"\\"\\"
            input TechSort {
              name: SortDirection
              value: SortDirection
            }

            input TechUpdateInput {
              name: String
              value: String
            }

            input TechWhere {
              AND: [TechWhere!]
              NOT: TechWhere
              OR: [TechWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }

            type TechnologiesConnection {
              edges: [TechEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateTechnologiesMutationResponse {
              info: UpdateInfo!
              technologies: [Tech!]!
            }"
        `);
    });

    test("Collision between Type and plural", async () => {
        const typeDefs = gql`
            type Tech @plural(value: "Techs") @node {
                name: String
            }

            type Techs @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTechsMutationResponse {
              info: CreateInfo!
              techs: [Techs!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createTechs(input: [TechsCreateInput!]!): CreateTechsMutationResponse!
              deleteTechs(where: TechsWhere): DeleteInfo!
              updateTechs(update: TechsUpdateInput, where: TechsWhere): UpdateTechsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              techs(limit: Int, offset: Int, options: TechsOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [TechsSort!], where: TechsWhere): [Techs!]!
              techsAggregate(where: TechsWhere): TechsAggregateSelection!
              techsConnection(after: String, first: Int, sort: [TechsSort], where: TechsWhere): TechsConnection!
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

            type Techs {
              value: String
            }

            type TechsAggregateSelection {
              count: Int!
              value: StringAggregateSelection!
            }

            type TechsConnection {
              edges: [TechsEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input TechsCreateInput {
              value: String
            }

            type TechsEdge {
              cursor: String!
              node: Techs!
            }

            input TechsOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more TechsSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [TechsSort!]
            }

            \\"\\"\\"
            Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one TechsSort object.
            \\"\\"\\"
            input TechsSort {
              value: SortDirection
            }

            input TechsUpdateInput {
              value: String
            }

            input TechsWhere {
              AND: [TechsWhere!]
              NOT: TechsWhere
              OR: [TechsWhere!]
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
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

            type UpdateTechsMutationResponse {
              info: UpdateInfo!
              techs: [Techs!]!
            }"
        `);
    });

    test("Same plural on multiple nodes", async () => {
        const typeDefs = gql`
            type Tech @plural(value: "Techs") @node {
                name: String
            }

            type User @plural(value: "Techs") @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateTechsMutationResponse {
              info: CreateInfo!
              techs: [User!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createTechs(input: [UserCreateInput!]!): CreateTechsMutationResponse!
              deleteTechs(where: UserWhere): DeleteInfo!
              updateTechs(update: UserUpdateInput, where: UserWhere): UpdateTechsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              techs(limit: Int, offset: Int, options: UserOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserSort!], where: UserWhere): [User!]!
              techsAggregate(where: UserWhere): UserAggregateSelection!
              techsConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): TechsConnection!
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

            type TechsConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type UpdateTechsMutationResponse {
              info: UpdateInfo!
              techs: [User!]!
            }

            type User {
              value: String
            }

            type UserAggregateSelection {
              count: Int!
              value: StringAggregateSelection!
            }

            input UserCreateInput {
              value: String
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Techs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            \\"\\"\\"
            Fields to sort Techs by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              value: SortDirection
            }

            input UserUpdateInput {
              value: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }"
        `);
    });

    test("Collision with pluralize", async () => {
        const typeDefs = gql`
            type Tech @plural(value: "Users") @node {
                name: String
            }

            type User @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              users(limit: Int, offset: Int, options: UserOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UserSort!], where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
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

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              value: String
            }

            type UserAggregateSelection {
              count: Int!
              value: StringAggregateSelection!
            }

            input UserCreateInput {
              value: String
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              value: SortDirection
            }

            input UserUpdateInput {
              value: String
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });

    test("Type collision with pluralize", async () => {
        const typeDefs = gql`
            type User @node {
                name: String
            }

            type Users @node {
                value: String
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
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [Users!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UsersCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UsersWhere): DeleteInfo!
              updateUsers(update: UsersUpdateInput, where: UsersWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              users(limit: Int, offset: Int, options: UsersOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [UsersSort!], where: UsersWhere): [Users!]!
              usersAggregate(where: UsersWhere): UsersAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UsersSort], where: UsersWhere): UsersConnection!
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

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [Users!]!
            }

            type Users {
              value: String
            }

            type UsersAggregateSelection {
              count: Int!
              value: StringAggregateSelection!
            }

            type UsersConnection {
              edges: [UsersEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UsersCreateInput {
              value: String
            }

            type UsersEdge {
              cursor: String!
              node: Users!
            }

            input UsersOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UsersSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UsersSort!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UsersSort object.
            \\"\\"\\"
            input UsersSort {
              value: SortDirection
            }

            input UsersUpdateInput {
              value: String
            }

            input UsersWhere {
              AND: [UsersWhere!]
              NOT: UsersWhere
              OR: [UsersWhere!]
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String]
              value_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              value_STARTS_WITH: String
            }"
        `);
    });
});
