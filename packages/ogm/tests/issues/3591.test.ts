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

import { generate, OGM } from "../../src";

describe("issues/3591", () => {
    test("should correctly generate types and ignore all the schema configuration directives", async () => {
        const typeDefs = `
          type User @query(aggregate: false) {
            id: ID! @id
            company: [Company!]! @relationship(type: "WORKS_AT", direction: OUT, aggregate: false)          
          }

          type Company {
            id: ID! @id
            field1: String @filterable(byValue: false, byAggregate: false)
            field2: String @selectable(onRead: false, onAggregate: false)
            field3: String @settable(onCreate: false, onUpdate: false)
          }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        await expect(
            generate({
                ogm,
                noWrite: true,
            })
        ).resolves.toMatchInlineSnapshot(`
            "import type { SelectionSetNode, DocumentNode } from \\"graphql\\";
            export type Maybe<T> = T | null;
            export type InputMaybe<T> = Maybe<T>;
            export type Exact<T extends { [key: string]: unknown }> = {
              [K in keyof T]: T[K];
            };
            export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
              [SubKey in K]?: Maybe<T[SubKey]>;
            };
            export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
              [SubKey in K]: Maybe<T[SubKey]>;
            };
            /** All built-in and custom scalars, mapped to their actual values */
            export type Scalars = {
              /** The \`ID\` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as \`\\"4\\"\`) or integer (such as \`4\`) input value will be accepted as an ID. */
              ID: string;
              /** The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
              String: string;
              /** The \`Boolean\` scalar type represents \`true\` or \`false\`. */
              Boolean: boolean;
              /** The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
              Int: number;
              /** The \`Float\` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
              Float: number;
            };

            export type Query = {
              __typename?: \\"Query\\";
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
              companies: Array<Company>;
              companiesConnection: CompaniesConnection;
              companiesAggregate: CompanyAggregateSelection;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              options?: InputMaybe<UserOptions>;
            };

            export type QueryUsersConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<UserWhere>;
              sort?: InputMaybe<Array<InputMaybe<UserSort>>>;
            };

            export type QueryUsersAggregateArgs = {
              where?: InputMaybe<UserWhere>;
            };

            export type QueryCompaniesArgs = {
              where?: InputMaybe<CompanyWhere>;
              options?: InputMaybe<CompanyOptions>;
            };

            export type QueryCompaniesConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<CompanyWhere>;
              sort?: InputMaybe<Array<InputMaybe<CompanySort>>>;
            };

            export type QueryCompaniesAggregateArgs = {
              where?: InputMaybe<CompanyWhere>;
            };

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createUsers: CreateUsersMutationResponse;
              deleteUsers: DeleteInfo;
              updateUsers: UpdateUsersMutationResponse;
              createCompanies: CreateCompaniesMutationResponse;
              deleteCompanies: DeleteInfo;
              updateCompanies: UpdateCompaniesMutationResponse;
            };

            export type MutationCreateUsersArgs = {
              input: Array<UserCreateInput>;
            };

            export type MutationDeleteUsersArgs = {
              where?: InputMaybe<UserWhere>;
              delete?: InputMaybe<UserDeleteInput>;
            };

            export type MutationUpdateUsersArgs = {
              where?: InputMaybe<UserWhere>;
              update?: InputMaybe<UserUpdateInput>;
              connect?: InputMaybe<UserConnectInput>;
              disconnect?: InputMaybe<UserDisconnectInput>;
              create?: InputMaybe<UserRelationInput>;
              delete?: InputMaybe<UserDeleteInput>;
              connectOrCreate?: InputMaybe<UserConnectOrCreateInput>;
            };

            export type MutationCreateCompaniesArgs = {
              input: Array<CompanyCreateInput>;
            };

            export type MutationDeleteCompaniesArgs = {
              where?: InputMaybe<CompanyWhere>;
            };

            export type MutationUpdateCompaniesArgs = {
              where?: InputMaybe<CompanyWhere>;
              update?: InputMaybe<CompanyUpdateInput>;
            };

            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            export type CompaniesConnection = {
              __typename?: \\"CompaniesConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<CompanyEdge>;
            };

            export type Company = {
              __typename?: \\"Company\\";
              id: Scalars[\\"ID\\"];
              field1?: Maybe<Scalars[\\"String\\"]>;
              field2?: Maybe<Scalars[\\"String\\"]>;
              field3?: Maybe<Scalars[\\"String\\"]>;
            };

            export type CompanyAggregateSelection = {
              __typename?: \\"CompanyAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              id: IdAggregateSelectionNonNullable;
              field1: StringAggregateSelectionNullable;
              field2: StringAggregateSelectionNullable;
              field3: StringAggregateSelectionNullable;
            };

            export type CompanyEdge = {
              __typename?: \\"CompanyEdge\\";
              cursor: Scalars[\\"String\\"];
              node: Company;
            };

            export type CreateCompaniesMutationResponse = {
              __typename?: \\"CreateCompaniesMutationResponse\\";
              info: CreateInfo;
              companies: Array<Company>;
            };

            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesCreated: Scalars[\\"Int\\"];
              relationshipsCreated: Scalars[\\"Int\\"];
            };

            export type CreateUsersMutationResponse = {
              __typename?: \\"CreateUsersMutationResponse\\";
              info: CreateInfo;
              users: Array<User>;
            };

            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesDeleted: Scalars[\\"Int\\"];
              relationshipsDeleted: Scalars[\\"Int\\"];
            };

            export type IdAggregateSelectionNonNullable = {
              __typename?: \\"IDAggregateSelectionNonNullable\\";
              shortest: Scalars[\\"ID\\"];
              longest: Scalars[\\"ID\\"];
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"];
              startCursor?: Maybe<Scalars[\\"String\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"]>;
            };

            export type StringAggregateSelectionNullable = {
              __typename?: \\"StringAggregateSelectionNullable\\";
              shortest?: Maybe<Scalars[\\"String\\"]>;
              longest?: Maybe<Scalars[\\"String\\"]>;
            };

            export type UpdateCompaniesMutationResponse = {
              __typename?: \\"UpdateCompaniesMutationResponse\\";
              info: UpdateInfo;
              companies: Array<Company>;
            };

            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesCreated: Scalars[\\"Int\\"];
              nodesDeleted: Scalars[\\"Int\\"];
              relationshipsCreated: Scalars[\\"Int\\"];
              relationshipsDeleted: Scalars[\\"Int\\"];
            };

            export type UpdateUsersMutationResponse = {
              __typename?: \\"UpdateUsersMutationResponse\\";
              info: UpdateInfo;
              users: Array<User>;
            };

            export type User = {
              __typename?: \\"User\\";
              id: Scalars[\\"ID\\"];
              company: Array<Company>;
              companyAggregate?: Maybe<UserCompanyCompanyAggregationSelection>;
              companyConnection: UserCompanyConnection;
            };

            export type UserCompanyArgs = {
              where?: InputMaybe<CompanyWhere>;
              options?: InputMaybe<CompanyOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type UserCompanyAggregateArgs = {
              where?: InputMaybe<CompanyWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type UserCompanyConnectionArgs = {
              where?: InputMaybe<UserCompanyConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
              sort?: InputMaybe<Array<UserCompanyConnectionSort>>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              id: IdAggregateSelectionNonNullable;
            };

            export type UserCompanyCompanyAggregationSelection = {
              __typename?: \\"UserCompanyCompanyAggregationSelection\\";
              count: Scalars[\\"Int\\"];
              node?: Maybe<UserCompanyCompanyNodeAggregateSelection>;
            };

            export type UserCompanyCompanyNodeAggregateSelection = {
              __typename?: \\"UserCompanyCompanyNodeAggregateSelection\\";
              id: IdAggregateSelectionNonNullable;
              field1: StringAggregateSelectionNullable;
              field2: StringAggregateSelectionNullable;
              field3: StringAggregateSelectionNullable;
            };

            export type UserCompanyConnection = {
              __typename?: \\"UserCompanyConnection\\";
              edges: Array<UserCompanyRelationship>;
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
            };

            export type UserCompanyRelationship = {
              __typename?: \\"UserCompanyRelationship\\";
              cursor: Scalars[\\"String\\"];
              node: Company;
            };

            export type UserEdge = {
              __typename?: \\"UserEdge\\";
              cursor: Scalars[\\"String\\"];
              node: User;
            };

            export type UsersConnection = {
              __typename?: \\"UsersConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<UserEdge>;
            };

            export type CompanyConnectOrCreateWhere = {
              node: CompanyUniqueWhere;
            };

            export type CompanyConnectWhere = {
              node: CompanyWhere;
            };

            export type CompanyCreateInput = {
              field1?: InputMaybe<Scalars[\\"String\\"]>;
              field2?: InputMaybe<Scalars[\\"String\\"]>;
              field3?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type CompanyOnCreateInput = {
              field1?: InputMaybe<Scalars[\\"String\\"]>;
              field2?: InputMaybe<Scalars[\\"String\\"]>;
              field3?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type CompanyOptions = {
              /** Specify one or more CompanySort objects to sort Companies by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<CompanySort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            /** Fields to sort Companies by. The order in which sorts are applied is not guaranteed when specifying many fields in one CompanySort object. */
            export type CompanySort = {
              id?: InputMaybe<SortDirection>;
              field1?: InputMaybe<SortDirection>;
              field2?: InputMaybe<SortDirection>;
              field3?: InputMaybe<SortDirection>;
            };

            export type CompanyUniqueWhere = {
              id?: InputMaybe<Scalars[\\"ID\\"]>;
            };

            export type CompanyUpdateInput = {
              field1?: InputMaybe<Scalars[\\"String\\"]>;
              field2?: InputMaybe<Scalars[\\"String\\"]>;
              field3?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type CompanyWhere = {
              OR?: InputMaybe<Array<CompanyWhere>>;
              AND?: InputMaybe<Array<CompanyWhere>>;
              NOT?: InputMaybe<CompanyWhere>;
              id?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT?: InputMaybe<Scalars[\\"ID\\"]>;
              id_IN?: InputMaybe<Array<Scalars[\\"ID\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_IN?: InputMaybe<Array<Scalars[\\"ID\\"]>>;
              id_CONTAINS?: InputMaybe<Scalars[\\"ID\\"]>;
              id_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              id_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_CONTAINS?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              field1?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              field1_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              field1_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              field1_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              field1_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              field2?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              field2_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              field2_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              field2_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              field2_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              field3?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              field3_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              field3_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              field3_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              field3_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserCompanyAggregateInput = {
              count?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              AND?: InputMaybe<Array<UserCompanyAggregateInput>>;
              OR?: InputMaybe<Array<UserCompanyAggregateInput>>;
              NOT?: InputMaybe<UserCompanyAggregateInput>;
              node?: InputMaybe<UserCompanyNodeAggregationWhereInput>;
            };

            export type UserCompanyConnectFieldInput = {
              where?: InputMaybe<CompanyConnectWhere>;
              /** Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0. */
              overwrite?: Scalars[\\"Boolean\\"];
            };

            export type UserCompanyConnectionSort = {
              node?: InputMaybe<CompanySort>;
            };

            export type UserCompanyConnectionWhere = {
              AND?: InputMaybe<Array<UserCompanyConnectionWhere>>;
              OR?: InputMaybe<Array<UserCompanyConnectionWhere>>;
              NOT?: InputMaybe<UserCompanyConnectionWhere>;
              node?: InputMaybe<CompanyWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              node_NOT?: InputMaybe<CompanyWhere>;
            };

            export type UserCompanyConnectOrCreateFieldInput = {
              where: CompanyConnectOrCreateWhere;
              onCreate: UserCompanyConnectOrCreateFieldInputOnCreate;
            };

            export type UserCompanyConnectOrCreateFieldInputOnCreate = {
              node: CompanyOnCreateInput;
            };

            export type UserCompanyCreateFieldInput = {
              node: CompanyCreateInput;
            };

            export type UserCompanyDeleteFieldInput = {
              where?: InputMaybe<UserCompanyConnectionWhere>;
            };

            export type UserCompanyDisconnectFieldInput = {
              where?: InputMaybe<UserCompanyConnectionWhere>;
            };

            export type UserCompanyFieldInput = {
              connectOrCreate?: InputMaybe<Array<UserCompanyConnectOrCreateFieldInput>>;
              create?: InputMaybe<Array<UserCompanyCreateFieldInput>>;
              connect?: InputMaybe<Array<UserCompanyConnectFieldInput>>;
            };

            export type UserCompanyNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<UserCompanyNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<UserCompanyNodeAggregationWhereInput>>;
              NOT?: InputMaybe<UserCompanyNodeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              id_EQUAL?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              field1_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              field1_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              field1_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              field1_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              field1_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field1_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              field2_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              field2_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              field2_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              field2_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              field2_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field2_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              field3_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              field3_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              field3_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              field3_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              field3_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              field3_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type UserCompanyUpdateConnectionInput = {
              node?: InputMaybe<CompanyUpdateInput>;
            };

            export type UserCompanyUpdateFieldInput = {
              where?: InputMaybe<UserCompanyConnectionWhere>;
              connectOrCreate?: InputMaybe<Array<UserCompanyConnectOrCreateFieldInput>>;
              create?: InputMaybe<Array<UserCompanyCreateFieldInput>>;
              connect?: InputMaybe<Array<UserCompanyConnectFieldInput>>;
              update?: InputMaybe<UserCompanyUpdateConnectionInput>;
              delete?: InputMaybe<Array<UserCompanyDeleteFieldInput>>;
              disconnect?: InputMaybe<Array<UserCompanyDisconnectFieldInput>>;
            };

            export type UserConnectInput = {
              company?: InputMaybe<Array<UserCompanyConnectFieldInput>>;
            };

            export type UserConnectOrCreateInput = {
              company?: InputMaybe<Array<UserCompanyConnectOrCreateFieldInput>>;
            };

            export type UserCreateInput = {
              company?: InputMaybe<UserCompanyFieldInput>;
            };

            export type UserDeleteInput = {
              company?: InputMaybe<Array<UserCompanyDeleteFieldInput>>;
            };

            export type UserDisconnectInput = {
              company?: InputMaybe<Array<UserCompanyDisconnectFieldInput>>;
            };

            export type UserOptions = {
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type UserRelationInput = {
              company?: InputMaybe<Array<UserCompanyCreateFieldInput>>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              id?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              company?: InputMaybe<Array<UserCompanyUpdateFieldInput>>;
            };

            export type UserWhere = {
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
              id?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT?: InputMaybe<Scalars[\\"ID\\"]>;
              id_IN?: InputMaybe<Array<Scalars[\\"ID\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_IN?: InputMaybe<Array<Scalars[\\"ID\\"]>>;
              id_CONTAINS?: InputMaybe<Scalars[\\"ID\\"]>;
              id_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              id_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_CONTAINS?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Use \`company_SOME\` instead. */
              company?: InputMaybe<CompanyWhere>;
              /** @deprecated Use \`company_NONE\` instead. */
              company_NOT?: InputMaybe<CompanyWhere>;
              companyAggregate?: InputMaybe<UserCompanyAggregateInput>;
              /** Return Users where all of the related Companies match this filter */
              company_ALL?: InputMaybe<CompanyWhere>;
              /** Return Users where none of the related Companies match this filter */
              company_NONE?: InputMaybe<CompanyWhere>;
              /** Return Users where one of the related Companies match this filter */
              company_SINGLE?: InputMaybe<CompanyWhere>;
              /** Return Users where some of the related Companies match this filter */
              company_SOME?: InputMaybe<CompanyWhere>;
              /** @deprecated Use \`companyConnection_SOME\` instead. */
              companyConnection?: InputMaybe<UserCompanyConnectionWhere>;
              /** @deprecated Use \`companyConnection_NONE\` instead. */
              companyConnection_NOT?: InputMaybe<UserCompanyConnectionWhere>;
              /** Return Users where all of the related UserCompanyConnections match this filter */
              companyConnection_ALL?: InputMaybe<UserCompanyConnectionWhere>;
              /** Return Users where none of the related UserCompanyConnections match this filter */
              companyConnection_NONE?: InputMaybe<UserCompanyConnectionWhere>;
              /** Return Users where one of the related UserCompanyConnections match this filter */
              companyConnection_SINGLE?: InputMaybe<UserCompanyConnectionWhere>;
              /** Return Users where some of the related UserCompanyConnections match this filter */
              companyConnection_SOME?: InputMaybe<UserCompanyConnectionWhere>;
            };

            export interface IdAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateSelectionInput {
              count?: boolean;
              id?: IdAggregateInputNonNullable;
            }

            export declare class UserModel {
              public find(args?: {
                where?: UserWhere;

                options?: UserOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<User[]>;
              public create(args: {
                input: UserCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreateUsersMutationResponse>;
              public update(args: {
                where?: UserWhere;
                update?: UserUpdateInput;
                connect?: UserConnectInput;
                disconnect?: UserDisconnectInput;
                create?: UserCreateInput;
                connectOrCreate?: UserConnectOrCreateInput;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateUsersMutationResponse>;
              public delete(args: {
                where?: UserWhere;
                delete?: UserDeleteInput;
                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: UserWhere;

                aggregate: UserAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<UserAggregateSelection>;
            }

            export interface IdAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface StringAggregateInputNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface CompanyAggregateSelectionInput {
              count?: boolean;
              id?: IdAggregateInputNonNullable;
              field1?: StringAggregateInputNullable;
              field2?: StringAggregateInputNullable;
              field3?: StringAggregateInputNullable;
            }

            export declare class CompanyModel {
              public find(args?: {
                where?: CompanyWhere;

                options?: CompanyOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<Company[]>;
              public create(args: {
                input: CompanyCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreateCompaniesMutationResponse>;
              public update(args: {
                where?: CompanyWhere;
                update?: CompanyUpdateInput;

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateCompaniesMutationResponse>;
              public delete(args: {
                where?: CompanyWhere;

                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: CompanyWhere;

                aggregate: CompanyAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<CompanyAggregateSelection>;
            }

            export interface ModelMap {
              User: UserModel;
              Company: CompanyModel;
            }
            "
        `);
    });
});
