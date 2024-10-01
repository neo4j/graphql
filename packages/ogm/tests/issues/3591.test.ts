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
          type User @query(aggregate: false) @mutation(operation: [CREATE]), @subscription(events: [CREATED]) @node {
            id: ID! @id
            company: [Company!]! @relationship(type: "WORKS_AT", direction: OUT)
            favoriteRestaurants: [Restaurant!]! @relationship(type: "FAVORITE_RESTAURANTS", direction: OUT)           
          }

          type Company @node {
            id: ID! @id
            field1: String @filterable(byValue: false, byAggregate: false)
            field2: String @selectable(onRead: false, onAggregate: false)
            field3: String @settable(onCreate: false, onUpdate: false)
          }

          type Restaurant @node {
            name: String
          }
        `;

        const ogm = new OGM({
            typeDefs,
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
            export type MakeEmpty<
              T extends { [key: string]: unknown },
              K extends keyof T
            > = { [_ in K]?: never };
            export type Incremental<T> =
              | T
              | {
                  [P in keyof T]?: P extends \\" $fragmentName\\" | \\"__typename\\" ? T[P] : never;
                };
            /** All built-in and custom scalars, mapped to their actual values */
            export type Scalars = {
              /** The \`ID\` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as \`\\"4\\"\`) or integer (such as \`4\`) input value will be accepted as an ID. */
              ID: { input: string; output: string };
              /** The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
              String: { input: string; output: string };
              /** The \`Boolean\` scalar type represents \`true\` or \`false\`. */
              Boolean: { input: boolean; output: boolean };
              /** The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
              Int: { input: number; output: number };
              /** The \`Float\` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
              Float: { input: number; output: number };
            };

            export type Query = {
              __typename?: \\"Query\\";
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
              companies: Array<Company>;
              companiesConnection: CompaniesConnection;
              companiesAggregate: CompanyAggregateSelection;
              restaurants: Array<Restaurant>;
              restaurantsConnection: RestaurantsConnection;
              restaurantsAggregate: RestaurantAggregateSelection;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<UserSort>>;
              options?: InputMaybe<UserOptions>;
            };

            export type QueryUsersConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<UserWhere>;
              sort?: InputMaybe<Array<UserSort>>;
            };

            export type QueryUsersAggregateArgs = {
              where?: InputMaybe<UserWhere>;
            };

            export type QueryCompaniesArgs = {
              where?: InputMaybe<CompanyWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<CompanySort>>;
              options?: InputMaybe<CompanyOptions>;
            };

            export type QueryCompaniesConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<CompanyWhere>;
              sort?: InputMaybe<Array<CompanySort>>;
            };

            export type QueryCompaniesAggregateArgs = {
              where?: InputMaybe<CompanyWhere>;
            };

            export type QueryRestaurantsArgs = {
              where?: InputMaybe<RestaurantWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<RestaurantSort>>;
              options?: InputMaybe<RestaurantOptions>;
            };

            export type QueryRestaurantsConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<RestaurantWhere>;
              sort?: InputMaybe<Array<RestaurantSort>>;
            };

            export type QueryRestaurantsAggregateArgs = {
              where?: InputMaybe<RestaurantWhere>;
            };

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createUsers: CreateUsersMutationResponse;
              deleteUsers: DeleteInfo;
              updateUsers: UpdateUsersMutationResponse;
              createCompanies: CreateCompaniesMutationResponse;
              deleteCompanies: DeleteInfo;
              updateCompanies: UpdateCompaniesMutationResponse;
              createRestaurants: CreateRestaurantsMutationResponse;
              deleteRestaurants: DeleteInfo;
              updateRestaurants: UpdateRestaurantsMutationResponse;
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

            export type MutationCreateRestaurantsArgs = {
              input: Array<RestaurantCreateInput>;
            };

            export type MutationDeleteRestaurantsArgs = {
              where?: InputMaybe<RestaurantWhere>;
            };

            export type MutationUpdateRestaurantsArgs = {
              where?: InputMaybe<RestaurantWhere>;
              update?: InputMaybe<RestaurantUpdateInput>;
            };

            /** An enum for sorting in either ascending or descending order. */
            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            export type CompaniesConnection = {
              __typename?: \\"CompaniesConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<CompanyEdge>;
            };

            export type Company = {
              __typename?: \\"Company\\";
              id: Scalars[\\"ID\\"][\\"output\\"];
              field1?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              field2?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              field3?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type CompanyAggregateSelection = {
              __typename?: \\"CompanyAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              id: IdAggregateSelection;
              field1: StringAggregateSelection;
              field2: StringAggregateSelection;
              field3: StringAggregateSelection;
            };

            export type CompanyEdge = {
              __typename?: \\"CompanyEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Company;
            };

            export type CreateCompaniesMutationResponse = {
              __typename?: \\"CreateCompaniesMutationResponse\\";
              info: CreateInfo;
              companies: Array<Company>;
            };

            /** Information about the number of nodes and relationships created during a create mutation */
            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              /** @deprecated This field has been deprecated because bookmarks are now handled by the driver. */
              bookmark?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type CreateRestaurantsMutationResponse = {
              __typename?: \\"CreateRestaurantsMutationResponse\\";
              info: CreateInfo;
              restaurants: Array<Restaurant>;
            };

            export type CreateUsersMutationResponse = {
              __typename?: \\"CreateUsersMutationResponse\\";
              info: CreateInfo;
              users: Array<User>;
            };

            /** Information about the number of nodes and relationships deleted during a delete mutation */
            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              /** @deprecated This field has been deprecated because bookmarks are now handled by the driver. */
              bookmark?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type IdAggregateSelection = {
              __typename?: \\"IDAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"ID\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"ID\\"][\\"output\\"]>;
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"][\\"output\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"][\\"output\\"];
              startCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type Restaurant = {
              __typename?: \\"Restaurant\\";
              name?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type RestaurantAggregateSelection = {
              __typename?: \\"RestaurantAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              name: StringAggregateSelection;
            };

            export type RestaurantEdge = {
              __typename?: \\"RestaurantEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Restaurant;
            };

            export type RestaurantsConnection = {
              __typename?: \\"RestaurantsConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<RestaurantEdge>;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type UpdateCompaniesMutationResponse = {
              __typename?: \\"UpdateCompaniesMutationResponse\\";
              info: UpdateInfo;
              companies: Array<Company>;
            };

            /** Information about the number of nodes and relationships created and deleted during an update mutation */
            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              /** @deprecated This field has been deprecated because bookmarks are now handled by the driver. */
              bookmark?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type UpdateRestaurantsMutationResponse = {
              __typename?: \\"UpdateRestaurantsMutationResponse\\";
              info: UpdateInfo;
              restaurants: Array<Restaurant>;
            };

            export type UpdateUsersMutationResponse = {
              __typename?: \\"UpdateUsersMutationResponse\\";
              info: UpdateInfo;
              users: Array<User>;
            };

            export type User = {
              __typename?: \\"User\\";
              id: Scalars[\\"ID\\"][\\"output\\"];
              companyAggregate?: Maybe<UserCompanyCompanyAggregationSelection>;
              company: Array<Company>;
              companyConnection: UserCompanyConnection;
              favoriteRestaurantsAggregate?: Maybe<UserRestaurantFavoriteRestaurantsAggregationSelection>;
              favoriteRestaurants: Array<Restaurant>;
              favoriteRestaurantsConnection: UserFavoriteRestaurantsConnection;
            };

            export type UserCompanyAggregateArgs = {
              where?: InputMaybe<CompanyWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type UserCompanyArgs = {
              where?: InputMaybe<CompanyWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<CompanySort>>;
              options?: InputMaybe<CompanyOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type UserCompanyConnectionArgs = {
              where?: InputMaybe<UserCompanyConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<UserCompanyConnectionSort>>;
            };

            export type UserFavoriteRestaurantsAggregateArgs = {
              where?: InputMaybe<RestaurantWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type UserFavoriteRestaurantsArgs = {
              where?: InputMaybe<RestaurantWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<RestaurantSort>>;
              options?: InputMaybe<RestaurantOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type UserFavoriteRestaurantsConnectionArgs = {
              where?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<UserFavoriteRestaurantsConnectionSort>>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              id: IdAggregateSelection;
            };

            export type UserCompanyCompanyAggregationSelection = {
              __typename?: \\"UserCompanyCompanyAggregationSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              node?: Maybe<UserCompanyCompanyNodeAggregateSelection>;
            };

            export type UserCompanyCompanyNodeAggregateSelection = {
              __typename?: \\"UserCompanyCompanyNodeAggregateSelection\\";
              id: IdAggregateSelection;
              field1: StringAggregateSelection;
              field2: StringAggregateSelection;
              field3: StringAggregateSelection;
            };

            export type UserCompanyConnection = {
              __typename?: \\"UserCompanyConnection\\";
              edges: Array<UserCompanyRelationship>;
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
            };

            export type UserCompanyRelationship = {
              __typename?: \\"UserCompanyRelationship\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Company;
            };

            export type UserEdge = {
              __typename?: \\"UserEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: User;
            };

            export type UserFavoriteRestaurantsConnection = {
              __typename?: \\"UserFavoriteRestaurantsConnection\\";
              edges: Array<UserFavoriteRestaurantsRelationship>;
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
            };

            export type UserFavoriteRestaurantsRelationship = {
              __typename?: \\"UserFavoriteRestaurantsRelationship\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Restaurant;
            };

            export type UserRestaurantFavoriteRestaurantsAggregationSelection = {
              __typename?: \\"UserRestaurantFavoriteRestaurantsAggregationSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              node?: Maybe<UserRestaurantFavoriteRestaurantsNodeAggregateSelection>;
            };

            export type UserRestaurantFavoriteRestaurantsNodeAggregateSelection = {
              __typename?: \\"UserRestaurantFavoriteRestaurantsNodeAggregateSelection\\";
              name: StringAggregateSelection;
            };

            export type UsersConnection = {
              __typename?: \\"UsersConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<UserEdge>;
            };

            export type CompanyConnectWhere = {
              node: CompanyWhere;
            };

            export type CompanyCreateInput = {
              field1?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field2?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field3?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type CompanyOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more CompanySort objects to sort Companies by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<CompanySort>>;
            };

            /** Fields to sort Companies by. The order in which sorts are applied is not guaranteed when specifying many fields in one CompanySort object. */
            export type CompanySort = {
              id?: InputMaybe<SortDirection>;
              field1?: InputMaybe<SortDirection>;
              field2?: InputMaybe<SortDirection>;
              field3?: InputMaybe<SortDirection>;
            };

            export type CompanyUpdateInput = {
              field1?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field2?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field3?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type CompanyWhere = {
              /** @deprecated Please use the explicit _EQ version */
              id?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_EQ?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_IN?: InputMaybe<Array<Scalars[\\"ID\\"][\\"input\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_IN?: InputMaybe<Array<Scalars[\\"ID\\"][\\"input\\"]>>;
              id_CONTAINS?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_CONTAINS?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              field1?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field1_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field1_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              field1_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field1_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field1_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field1_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              field2?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field2_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field2_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              field2_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field2_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field2_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field2_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              field3?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field3_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field3_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              field3_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field3_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              field3_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              field3_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<CompanyWhere>>;
              AND?: InputMaybe<Array<CompanyWhere>>;
              NOT?: InputMaybe<CompanyWhere>;
            };

            export type RestaurantConnectWhere = {
              node: RestaurantWhere;
            };

            export type RestaurantCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type RestaurantOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more RestaurantSort objects to sort Restaurants by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<RestaurantSort>>;
            };

            /** Fields to sort Restaurants by. The order in which sorts are applied is not guaranteed when specifying many fields in one RestaurantSort object. */
            export type RestaurantSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type RestaurantUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type RestaurantWhere = {
              /** @deprecated Please use the explicit _EQ version */
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<RestaurantWhere>>;
              AND?: InputMaybe<Array<RestaurantWhere>>;
              NOT?: InputMaybe<RestaurantWhere>;
            };

            export type UserCompanyAggregateInput = {
              count?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              AND?: InputMaybe<Array<UserCompanyAggregateInput>>;
              OR?: InputMaybe<Array<UserCompanyAggregateInput>>;
              NOT?: InputMaybe<UserCompanyAggregateInput>;
              node?: InputMaybe<UserCompanyNodeAggregationWhereInput>;
            };

            export type UserCompanyConnectFieldInput = {
              where?: InputMaybe<CompanyConnectWhere>;
              /** Whether or not to overwrite any matching relationship with the new properties. */
              overwrite?: Scalars[\\"Boolean\\"][\\"input\\"];
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
              connect?: InputMaybe<Array<UserCompanyConnectFieldInput>>;
              create?: InputMaybe<Array<UserCompanyCreateFieldInput>>;
            };

            export type UserCompanyNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<UserCompanyNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<UserCompanyNodeAggregationWhereInput>>;
              NOT?: InputMaybe<UserCompanyNodeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              id_EQUAL?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_EQUAL?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field1_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field1_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field1_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field1_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field1_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field1_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field1_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field1_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_EQUAL?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field2_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field2_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field2_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field2_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field2_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field2_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field2_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field2_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_EQUAL?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field3_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field3_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field3_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field3_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              field3_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              field3_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              field3_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              field3_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type UserCompanyUpdateConnectionInput = {
              node?: InputMaybe<CompanyUpdateInput>;
            };

            export type UserCompanyUpdateFieldInput = {
              where?: InputMaybe<UserCompanyConnectionWhere>;
              connect?: InputMaybe<Array<UserCompanyConnectFieldInput>>;
              disconnect?: InputMaybe<Array<UserCompanyDisconnectFieldInput>>;
              create?: InputMaybe<Array<UserCompanyCreateFieldInput>>;
              update?: InputMaybe<UserCompanyUpdateConnectionInput>;
              delete?: InputMaybe<Array<UserCompanyDeleteFieldInput>>;
            };

            export type UserConnectInput = {
              company?: InputMaybe<Array<UserCompanyConnectFieldInput>>;
              favoriteRestaurants?: InputMaybe<
                Array<UserFavoriteRestaurantsConnectFieldInput>
              >;
            };

            export type UserCreateInput = {
              company?: InputMaybe<UserCompanyFieldInput>;
              favoriteRestaurants?: InputMaybe<UserFavoriteRestaurantsFieldInput>;
            };

            export type UserDeleteInput = {
              company?: InputMaybe<Array<UserCompanyDeleteFieldInput>>;
              favoriteRestaurants?: InputMaybe<
                Array<UserFavoriteRestaurantsDeleteFieldInput>
              >;
            };

            export type UserDisconnectInput = {
              company?: InputMaybe<Array<UserCompanyDisconnectFieldInput>>;
              favoriteRestaurants?: InputMaybe<
                Array<UserFavoriteRestaurantsDisconnectFieldInput>
              >;
            };

            export type UserFavoriteRestaurantsAggregateInput = {
              count?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              AND?: InputMaybe<Array<UserFavoriteRestaurantsAggregateInput>>;
              OR?: InputMaybe<Array<UserFavoriteRestaurantsAggregateInput>>;
              NOT?: InputMaybe<UserFavoriteRestaurantsAggregateInput>;
              node?: InputMaybe<UserFavoriteRestaurantsNodeAggregationWhereInput>;
            };

            export type UserFavoriteRestaurantsConnectFieldInput = {
              where?: InputMaybe<RestaurantConnectWhere>;
              /** Whether or not to overwrite any matching relationship with the new properties. */
              overwrite?: Scalars[\\"Boolean\\"][\\"input\\"];
            };

            export type UserFavoriteRestaurantsConnectionSort = {
              node?: InputMaybe<RestaurantSort>;
            };

            export type UserFavoriteRestaurantsConnectionWhere = {
              AND?: InputMaybe<Array<UserFavoriteRestaurantsConnectionWhere>>;
              OR?: InputMaybe<Array<UserFavoriteRestaurantsConnectionWhere>>;
              NOT?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              node?: InputMaybe<RestaurantWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              node_NOT?: InputMaybe<RestaurantWhere>;
            };

            export type UserFavoriteRestaurantsCreateFieldInput = {
              node: RestaurantCreateInput;
            };

            export type UserFavoriteRestaurantsDeleteFieldInput = {
              where?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
            };

            export type UserFavoriteRestaurantsDisconnectFieldInput = {
              where?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
            };

            export type UserFavoriteRestaurantsFieldInput = {
              connect?: InputMaybe<Array<UserFavoriteRestaurantsConnectFieldInput>>;
              create?: InputMaybe<Array<UserFavoriteRestaurantsCreateFieldInput>>;
            };

            export type UserFavoriteRestaurantsNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<UserFavoriteRestaurantsNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<UserFavoriteRestaurantsNodeAggregationWhereInput>>;
              NOT?: InputMaybe<UserFavoriteRestaurantsNodeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_EQUAL?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type UserFavoriteRestaurantsUpdateConnectionInput = {
              node?: InputMaybe<RestaurantUpdateInput>;
            };

            export type UserFavoriteRestaurantsUpdateFieldInput = {
              where?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              connect?: InputMaybe<Array<UserFavoriteRestaurantsConnectFieldInput>>;
              disconnect?: InputMaybe<Array<UserFavoriteRestaurantsDisconnectFieldInput>>;
              create?: InputMaybe<Array<UserFavoriteRestaurantsCreateFieldInput>>;
              update?: InputMaybe<UserFavoriteRestaurantsUpdateConnectionInput>;
              delete?: InputMaybe<Array<UserFavoriteRestaurantsDeleteFieldInput>>;
            };

            export type UserOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
            };

            export type UserRelationInput = {
              company?: InputMaybe<Array<UserCompanyCreateFieldInput>>;
              favoriteRestaurants?: InputMaybe<
                Array<UserFavoriteRestaurantsCreateFieldInput>
              >;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              id?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              company?: InputMaybe<Array<UserCompanyUpdateFieldInput>>;
              favoriteRestaurants?: InputMaybe<
                Array<UserFavoriteRestaurantsUpdateFieldInput>
              >;
            };

            export type UserWhere = {
              /** @deprecated Please use the explicit _EQ version */
              id?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_EQ?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_IN?: InputMaybe<Array<Scalars[\\"ID\\"][\\"input\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_IN?: InputMaybe<Array<Scalars[\\"ID\\"][\\"input\\"]>>;
              id_CONTAINS?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_CONTAINS?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              id_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
              /** @deprecated Use \`company_SOME\` instead. */
              company?: InputMaybe<CompanyWhere>;
              /** @deprecated Use \`company_NONE\` instead. */
              company_NOT?: InputMaybe<CompanyWhere>;
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
              companyAggregate?: InputMaybe<UserCompanyAggregateInput>;
              /** @deprecated Use \`favoriteRestaurants_SOME\` instead. */
              favoriteRestaurants?: InputMaybe<RestaurantWhere>;
              /** @deprecated Use \`favoriteRestaurants_NONE\` instead. */
              favoriteRestaurants_NOT?: InputMaybe<RestaurantWhere>;
              /** Return Users where all of the related Restaurants match this filter */
              favoriteRestaurants_ALL?: InputMaybe<RestaurantWhere>;
              /** Return Users where none of the related Restaurants match this filter */
              favoriteRestaurants_NONE?: InputMaybe<RestaurantWhere>;
              /** Return Users where one of the related Restaurants match this filter */
              favoriteRestaurants_SINGLE?: InputMaybe<RestaurantWhere>;
              /** Return Users where some of the related Restaurants match this filter */
              favoriteRestaurants_SOME?: InputMaybe<RestaurantWhere>;
              /** @deprecated Use \`favoriteRestaurantsConnection_SOME\` instead. */
              favoriteRestaurantsConnection?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              /** @deprecated Use \`favoriteRestaurantsConnection_NONE\` instead. */
              favoriteRestaurantsConnection_NOT?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              /** Return Users where all of the related UserFavoriteRestaurantsConnections match this filter */
              favoriteRestaurantsConnection_ALL?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              /** Return Users where none of the related UserFavoriteRestaurantsConnections match this filter */
              favoriteRestaurantsConnection_NONE?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              /** Return Users where one of the related UserFavoriteRestaurantsConnections match this filter */
              favoriteRestaurantsConnection_SINGLE?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              /** Return Users where some of the related UserFavoriteRestaurantsConnections match this filter */
              favoriteRestaurantsConnection_SOME?: InputMaybe<UserFavoriteRestaurantsConnectionWhere>;
              favoriteRestaurantsAggregate?: InputMaybe<UserFavoriteRestaurantsAggregateInput>;
            };

            export interface UserAggregateSelectionInput {
              count?: boolean;
              id?: boolean;
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

            export interface CompanyAggregateSelectionInput {
              count?: boolean;
              id?: boolean;
              field1?: boolean;
              field2?: boolean;
              field3?: boolean;
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

            export interface RestaurantAggregateSelectionInput {
              count?: boolean;
              name?: boolean;
            }

            export declare class RestaurantModel {
              public find(args?: {
                where?: RestaurantWhere;

                options?: RestaurantOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<Restaurant[]>;
              public create(args: {
                input: RestaurantCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreateRestaurantsMutationResponse>;
              public update(args: {
                where?: RestaurantWhere;
                update?: RestaurantUpdateInput;

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateRestaurantsMutationResponse>;
              public delete(args: {
                where?: RestaurantWhere;

                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: RestaurantWhere;

                aggregate: RestaurantAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<RestaurantAggregateSelection>;
            }

            export interface ModelMap {
              User: UserModel;
              Company: CompanyModel;
              Restaurant: RestaurantModel;
            }
            "
        `);
    });
});
