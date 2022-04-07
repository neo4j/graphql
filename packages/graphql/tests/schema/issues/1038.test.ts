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
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/1038", () => {
    test("AWSAccount and DNSZone should be cased correctly", async () => {
        const typeDefs = gql`
            type AWSAccount {
                code: String
                accountName: String
            }

            type DNSZone {
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
              accountName: StringAggregateSelectionNullable!
              code: StringAggregateSelectionNullable!
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

            input AWSAccountOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more AWSAccountSort objects to sort AwsAccounts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [AWSAccountSort!]
            }

            \\"\\"\\"
            Fields to sort AwsAccounts by. The order in which sorts are applied is not guaranteed when specifying many fields in one AWSAccountSort object.
            \\"\\"\\"
            input AWSAccountSort {
              accountName: SortDirection
              code: SortDirection
            }

            input AWSAccountUpdateInput {
              accountName: String
              code: String
            }

            input AWSAccountWhere {
              AND: [AWSAccountWhere!]
              OR: [AWSAccountWhere!]
              accountName: String
              accountName_CONTAINS: String
              accountName_ENDS_WITH: String
              accountName_IN: [String]
              accountName_NOT: String
              accountName_NOT_CONTAINS: String
              accountName_NOT_ENDS_WITH: String
              accountName_NOT_IN: [String]
              accountName_NOT_STARTS_WITH: String
              accountName_STARTS_WITH: String
              code: String
              code_CONTAINS: String
              code_ENDS_WITH: String
              code_IN: [String]
              code_NOT: String
              code_NOT_CONTAINS: String
              code_NOT_ENDS_WITH: String
              code_NOT_IN: [String]
              code_NOT_STARTS_WITH: String
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

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type DNSZone {
              awsId: String
              zoneType: String
            }

            type DNSZoneAggregateSelection {
              awsId: StringAggregateSelectionNullable!
              count: Int!
              zoneType: StringAggregateSelectionNullable!
            }

            input DNSZoneCreateInput {
              awsId: String
              zoneType: String
            }

            type DNSZoneEdge {
              cursor: String!
              node: DNSZone!
            }

            input DNSZoneOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more DNSZoneSort objects to sort DnsZones by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [DNSZoneSort!]
            }

            \\"\\"\\"
            Fields to sort DnsZones by. The order in which sorts are applied is not guaranteed when specifying many fields in one DNSZoneSort object.
            \\"\\"\\"
            input DNSZoneSort {
              awsId: SortDirection
              zoneType: SortDirection
            }

            input DNSZoneUpdateInput {
              awsId: String
              zoneType: String
            }

            input DNSZoneWhere {
              AND: [DNSZoneWhere!]
              OR: [DNSZoneWhere!]
              awsId: String
              awsId_CONTAINS: String
              awsId_ENDS_WITH: String
              awsId_IN: [String]
              awsId_NOT: String
              awsId_NOT_CONTAINS: String
              awsId_NOT_ENDS_WITH: String
              awsId_NOT_IN: [String]
              awsId_NOT_STARTS_WITH: String
              awsId_STARTS_WITH: String
              zoneType: String
              zoneType_CONTAINS: String
              zoneType_ENDS_WITH: String
              zoneType_IN: [String]
              zoneType_NOT: String
              zoneType_NOT_CONTAINS: String
              zoneType_NOT_ENDS_WITH: String
              zoneType_NOT_IN: [String]
              zoneType_NOT_STARTS_WITH: String
              zoneType_STARTS_WITH: String
            }

            type DeleteInfo {
              bookmark: String
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
              awsAccounts(options: AWSAccountOptions, where: AWSAccountWhere): [AWSAccount!]!
              awsAccountsAggregate(where: AWSAccountWhere): AWSAccountAggregateSelection!
              awsAccountsConnection(after: String, first: Int, sort: [AWSAccountSort], where: AWSAccountWhere): AwsAccountsConnection!
              dnsZones(options: DNSZoneOptions, where: DNSZoneWhere): [DNSZone!]!
              dnsZonesAggregate(where: DNSZoneWhere): DNSZoneAggregateSelection!
              dnsZonesConnection(after: String, first: Int, sort: [DNSZoneSort], where: DNSZoneWhere): DnsZonesConnection!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateAwsAccountsMutationResponse {
              awsAccounts: [AWSAccount!]!
              info: UpdateInfo!
            }

            type UpdateDnsZonesMutationResponse {
              dnsZones: [DNSZone!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }"
        `);
    });
});
