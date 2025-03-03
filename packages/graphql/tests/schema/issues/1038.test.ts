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

            type AWSAccountAggregate {
              count: Count!
              node: AWSAccountAggregateNode!
            }

            type AWSAccountAggregateNode {
              accountName: StringAggregateSelection!
              code: StringAggregateSelection!
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
              accountName_SET: String @deprecated(reason: \\"Please use the generic mutation 'accountName: { set: ... } }' instead.\\")
              code: StringScalarMutations
              code_SET: String @deprecated(reason: \\"Please use the generic mutation 'code: { set: ... } }' instead.\\")
            }

            input AWSAccountWhere {
              AND: [AWSAccountWhere!]
              NOT: AWSAccountWhere
              OR: [AWSAccountWhere!]
              accountName: StringScalarFilters
              accountName_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter accountName: { contains: ... }\\")
              accountName_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter accountName: { endsWith: ... }\\")
              accountName_EQ: String @deprecated(reason: \\"Please use the relevant generic filter accountName: { eq: ... }\\")
              accountName_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter accountName: { in: ... }\\")
              accountName_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter accountName: { startsWith: ... }\\")
              code: StringScalarFilters
              code_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter code: { contains: ... }\\")
              code_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter code: { endsWith: ... }\\")
              code_EQ: String @deprecated(reason: \\"Please use the relevant generic filter code: { eq: ... }\\")
              code_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter code: { in: ... }\\")
              code_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter code: { startsWith: ... }\\")
            }

            type AwsAccountsConnection {
              aggregate: AWSAccountAggregate!
              edges: [AWSAccountEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Count {
              nodes: Int!
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

            type DNSZoneAggregate {
              count: Count!
              node: DNSZoneAggregateNode!
            }

            type DNSZoneAggregateNode {
              awsId: StringAggregateSelection!
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
              awsId_SET: String @deprecated(reason: \\"Please use the generic mutation 'awsId: { set: ... } }' instead.\\")
              zoneType: StringScalarMutations
              zoneType_SET: String @deprecated(reason: \\"Please use the generic mutation 'zoneType: { set: ... } }' instead.\\")
            }

            input DNSZoneWhere {
              AND: [DNSZoneWhere!]
              NOT: DNSZoneWhere
              OR: [DNSZoneWhere!]
              awsId: StringScalarFilters
              awsId_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter awsId: { contains: ... }\\")
              awsId_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter awsId: { endsWith: ... }\\")
              awsId_EQ: String @deprecated(reason: \\"Please use the relevant generic filter awsId: { eq: ... }\\")
              awsId_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter awsId: { in: ... }\\")
              awsId_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter awsId: { startsWith: ... }\\")
              zoneType: StringScalarFilters
              zoneType_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter zoneType: { contains: ... }\\")
              zoneType_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter zoneType: { endsWith: ... }\\")
              zoneType_EQ: String @deprecated(reason: \\"Please use the relevant generic filter zoneType: { eq: ... }\\")
              zoneType_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter zoneType: { in: ... }\\")
              zoneType_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter zoneType: { startsWith: ... }\\")
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DnsZonesConnection {
              aggregate: DNSZoneAggregate!
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
              awsAccountsConnection(after: String, first: Int, sort: [AWSAccountSort!], where: AWSAccountWhere): AwsAccountsConnection!
              dnsZones(limit: Int, offset: Int, sort: [DNSZoneSort!], where: DNSZoneWhere): [DNSZone!]!
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
              eq: String
              in: [String!]
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
