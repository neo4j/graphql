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

describe("https://github.com/neo4j/graphql/issues/1038", () => {
    test("AWSAccount and DNSZone should be cased correctly", async () => {
        const typeDefs = gql`
            type AWSAccount @node {
                code: String
                accountName: String
            }

            type DNSZone @node {
                awsId: String
                zoneType: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type AWSAccount {
              accountName: String
              code: String
            }

            type AWSAccountAggregateSelection {
              accountName: StringAggregateSelection!
              code: StringAggregateSelection!
              count: Int!
            }

            input AWSAccountCreateInput {
              accountName: String
              code: String
            }

            type AWSAccountEdge {
              cursor: String!
              node: AWSAccount!
            }

            \\"\\"\\"
            Fields to sort AwsAccounts by. The order in which sorts are applied is not guaranteed when specifying many fields in one AWSAccountSort object.
            \\"\\"\\"
            input AWSAccountSort {
              accountName: SortDirection
              code: SortDirection
            }

            input AWSAccountUpdateInput {
              accountName: StringScalarMutations
              accountName_SET: String
              code: StringScalarMutations
              code_SET: String
            }

            input AWSAccountWhere {
              AND: [AWSAccountWhere!]
              NOT: AWSAccountWhere
              OR: [AWSAccountWhere!]
              accountName: StringScalarFilters
              accountName_CONTAINS: String
              accountName_ENDS_WITH: String
              accountName_EQ: String
              accountName_IN: [String]
              accountName_STARTS_WITH: String
              code: StringScalarFilters
              code_CONTAINS: String
              code_ENDS_WITH: String
              code_EQ: String
              code_IN: [String]
              code_STARTS_WITH: String
            }

            type AwsAccountsConnection {
              edges: [AWSAccountEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateAwsAccountsMutationResponse {
              awsAccounts: [AWSAccount!]!
              info: CreateInfo!
            }

            type CreateDnsZonesMutationResponse {
              dnsZones: [DNSZone!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type DNSZone {
              awsId: String
              zoneType: String
            }

            type DNSZoneAggregateSelection {
              awsId: StringAggregateSelection!
              count: Int!
              zoneType: StringAggregateSelection!
            }

            input DNSZoneCreateInput {
              awsId: String
              zoneType: String
            }

            type DNSZoneEdge {
              cursor: String!
              node: DNSZone!
            }

            \\"\\"\\"
            Fields to sort DnsZones by. The order in which sorts are applied is not guaranteed when specifying many fields in one DNSZoneSort object.
            \\"\\"\\"
            input DNSZoneSort {
              awsId: SortDirection
              zoneType: SortDirection
            }

            input DNSZoneUpdateInput {
              awsId: StringScalarMutations
              awsId_SET: String
              zoneType: StringScalarMutations
              zoneType_SET: String
            }

            input DNSZoneWhere {
              AND: [DNSZoneWhere!]
              NOT: DNSZoneWhere
              OR: [DNSZoneWhere!]
              awsId: StringScalarFilters
              awsId_CONTAINS: String
              awsId_ENDS_WITH: String
              awsId_EQ: String
              awsId_IN: [String]
              awsId_STARTS_WITH: String
              zoneType: StringScalarFilters
              zoneType_CONTAINS: String
              zoneType_ENDS_WITH: String
              zoneType_EQ: String
              zoneType_IN: [String]
              zoneType_STARTS_WITH: String
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DnsZonesConnection {
              edges: [DNSZoneEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createAwsAccounts(input: [AWSAccountCreateInput!]!): CreateAwsAccountsMutationResponse!
              createDnsZones(input: [DNSZoneCreateInput!]!): CreateDnsZonesMutationResponse!
              deleteAwsAccounts(where: AWSAccountWhere): DeleteInfo!
              deleteDnsZones(where: DNSZoneWhere): DeleteInfo!
              updateAwsAccounts(update: AWSAccountUpdateInput, where: AWSAccountWhere): UpdateAwsAccountsMutationResponse!
              updateDnsZones(update: DNSZoneUpdateInput, where: DNSZoneWhere): UpdateDnsZonesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              awsAccounts(limit: Int, offset: Int, sort: [AWSAccountSort!], where: AWSAccountWhere): [AWSAccount!]!
              awsAccountsAggregate(where: AWSAccountWhere): AWSAccountAggregateSelection!
              awsAccountsConnection(after: String, first: Int, sort: [AWSAccountSort!], where: AWSAccountWhere): AwsAccountsConnection!
              dnsZones(limit: Int, offset: Int, sort: [DNSZoneSort!], where: DNSZoneWhere): [DNSZone!]!
              dnsZonesAggregate(where: DNSZoneWhere): DNSZoneAggregateSelection!
              dnsZonesConnection(after: String, first: Int, sort: [DNSZoneSort!], where: DNSZoneWhere): DnsZonesConnection!
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
              equals: String
              greaterThan: String
              greaterThanEquals: String
              in: [String!]
              lessThan: String
              lessThanEquals: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            type UpdateAwsAccountsMutationResponse {
              awsAccounts: [AWSAccount!]!
              info: UpdateInfo!
            }

            type UpdateDnsZonesMutationResponse {
              dnsZones: [DNSZone!]!
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
