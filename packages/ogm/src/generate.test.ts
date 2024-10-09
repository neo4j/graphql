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

import * as fs from "fs";
import * as path from "path";
import { generate as randomstring } from "randomstring";
import generate from "./generate";
import { OGM } from "./index";

describe("generate", () => {
    const filesToDelete: string[] = [];

    afterAll(async () => {
        await Promise.all(filesToDelete.map((name) => fs.promises.unlink(name)));
    });

    test("should generate simple types of a single node and return the string", async () => {
        const typeDefs = `
            type User @node {
                name: String
            }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        const generated = (await generate({
            ogm,
            noWrite: true,
        })) as string;

        expect(generated).toMatchInlineSnapshot(`
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
              ID: { input: string; output: string };
              /** The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
              String: { input: string; output: string };
              /** The \`Boolean\` scalar type represents \`true\` or \`false\`. */
              Boolean: { input: boolean; output: boolean };
              /** The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
              Int: { input: number; output: number };
              Float: { input: number; output: number };
            };

            export type Query = {
              __typename?: \\"Query\\";
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
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

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createUsers: CreateUsersMutationResponse;
              deleteUsers: DeleteInfo;
              updateUsers: UpdateUsersMutationResponse;
            };

            export type MutationCreateUsersArgs = {
              input: Array<UserCreateInput>;
            };

            export type MutationDeleteUsersArgs = {
              where?: InputMaybe<UserWhere>;
            };

            export type MutationUpdateUsersArgs = {
              where?: InputMaybe<UserWhere>;
              update?: InputMaybe<UserUpdateInput>;
            };

            /** An enum for sorting in either ascending or descending order. */
            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            /** Information about the number of nodes and relationships created during a create mutation */
            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type CreateUsersMutationResponse = {
              __typename?: \\"CreateUsersMutationResponse\\";
              info: CreateInfo;
              users: Array<User>;
            };

            /** Information about the number of nodes and relationships deleted during a delete mutation */
            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"][\\"output\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"][\\"output\\"];
              startCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            /** Information about the number of nodes and relationships created and deleted during an update mutation */
            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type UpdateUsersMutationResponse = {
              __typename?: \\"UpdateUsersMutationResponse\\";
              info: UpdateInfo;
              users: Array<User>;
            };

            export type User = {
              __typename?: \\"User\\";
              name?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              name: StringAggregateSelection;
            };

            export type UserEdge = {
              __typename?: \\"UserEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: User;
            };

            export type UsersConnection = {
              __typename?: \\"UsersConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<UserEdge>;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type UserOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type UserWhere = {
              /** @deprecated Please use the explicit _EQ version */
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
            };

            export interface UserAggregateSelectionInput {
              count?: boolean;
              name?: boolean;
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

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateUsersMutationResponse>;
              public delete(args: {
                where?: UserWhere;

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

            export interface ModelMap {
              User: UserModel;
            }
            "
        `);
    });

    test("should generate simple types of a single node with fulltext directive and return the string", async () => {
        const typeDefs = `
            type User @node {
                name: String
            }

            extend type User @fulltext(indexes: [{ name: "UserName", fields: ["name"] }])
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        const generated = (await generate({
            ogm,
            noWrite: true,
        })) as string;

        expect(generated).toMatchInlineSnapshot(`
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
              /** Query a full-text index. This query returns the query score, but does not allow for aggregations. Use the \`fulltext\` argument under other queries for this functionality. */
              usersFulltextUserName: Array<UserFulltextResult>;
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
            };

            export type QueryUsersFulltextUserNameArgs = {
              phrase: Scalars[\\"String\\"][\\"input\\"];
              where?: InputMaybe<UserFulltextWhere>;
              sort?: InputMaybe<Array<UserFulltextSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              fulltext?: InputMaybe<UserFulltext>;
              sort?: InputMaybe<Array<UserSort>>;
              options?: InputMaybe<UserOptions>;
            };

            export type QueryUsersConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<UserWhere>;
              sort?: InputMaybe<Array<UserSort>>;
              fulltext?: InputMaybe<UserFulltext>;
            };

            export type QueryUsersAggregateArgs = {
              where?: InputMaybe<UserWhere>;
              fulltext?: InputMaybe<UserFulltext>;
            };

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createUsers: CreateUsersMutationResponse;
              deleteUsers: DeleteInfo;
              updateUsers: UpdateUsersMutationResponse;
            };

            export type MutationCreateUsersArgs = {
              input: Array<UserCreateInput>;
            };

            export type MutationDeleteUsersArgs = {
              where?: InputMaybe<UserWhere>;
            };

            export type MutationUpdateUsersArgs = {
              where?: InputMaybe<UserWhere>;
              update?: InputMaybe<UserUpdateInput>;
            };

            /** An enum for sorting in either ascending or descending order. */
            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            /** Information about the number of nodes and relationships created during a create mutation */
            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type CreateUsersMutationResponse = {
              __typename?: \\"CreateUsersMutationResponse\\";
              info: CreateInfo;
              users: Array<User>;
            };

            /** Information about the number of nodes and relationships deleted during a delete mutation */
            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"][\\"output\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"][\\"output\\"];
              startCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            /** Information about the number of nodes and relationships created and deleted during an update mutation */
            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type UpdateUsersMutationResponse = {
              __typename?: \\"UpdateUsersMutationResponse\\";
              info: UpdateInfo;
              users: Array<User>;
            };

            export type User = {
              __typename?: \\"User\\";
              name?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              name: StringAggregateSelection;
            };

            export type UserEdge = {
              __typename?: \\"UserEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: User;
            };

            /** The result of a fulltext search on an index of User */
            export type UserFulltextResult = {
              __typename?: \\"UserFulltextResult\\";
              score: Scalars[\\"Float\\"][\\"output\\"];
              user: User;
            };

            export type UsersConnection = {
              __typename?: \\"UsersConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<UserEdge>;
            };

            /** The input for filtering a float */
            export type FloatWhere = {
              min?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              max?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type UserFulltext = {
              UserName?: InputMaybe<UserUserNameFulltext>;
            };

            /** The input for sorting a fulltext query on an index of User */
            export type UserFulltextSort = {
              score?: InputMaybe<SortDirection>;
              user?: InputMaybe<UserSort>;
            };

            /** The input for filtering a fulltext query on an index of User */
            export type UserFulltextWhere = {
              score?: InputMaybe<FloatWhere>;
              user?: InputMaybe<UserWhere>;
            };

            export type UserOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type UserUserNameFulltext = {
              phrase: Scalars[\\"String\\"][\\"input\\"];
            };

            export type UserWhere = {
              /** @deprecated Please use the explicit _EQ version */
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
            };

            export interface UserAggregateSelectionInput {
              count?: boolean;
              name?: boolean;
            }

            export declare class UserModel {
              public find(args?: {
                where?: UserWhere;
                fulltext?: UserFulltext;
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

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateUsersMutationResponse>;
              public delete(args: {
                where?: UserWhere;

                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: UserWhere;
                fulltext?: UserFulltext;
                aggregate: UserAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<UserAggregateSelection>;
            }

            export interface ModelMap {
              User: UserModel;
            }
            "
        `);
    });

    test("should generate simple types of a single node and write to a file", async () => {
        const fileName = `${randomstring({
            readable: true,
            charset: "alphabetic",
        })}.test-file.ts`;

        const outFile = path.join(__dirname, fileName);

        filesToDelete.push(outFile);

        const typeDefs = `
            type User @node {
                name: String
            }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        await generate({
            ogm,
            outFile,
        });

        const fileContent = await fs.promises.readFile(outFile, "utf-8");

        expect(fileContent).toMatchInlineSnapshot(`
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
              ID: { input: string; output: string };
              /** The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
              String: { input: string; output: string };
              /** The \`Boolean\` scalar type represents \`true\` or \`false\`. */
              Boolean: { input: boolean; output: boolean };
              /** The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
              Int: { input: number; output: number };
              Float: { input: number; output: number };
            };

            export type Query = {
              __typename?: \\"Query\\";
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
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

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createUsers: CreateUsersMutationResponse;
              deleteUsers: DeleteInfo;
              updateUsers: UpdateUsersMutationResponse;
            };

            export type MutationCreateUsersArgs = {
              input: Array<UserCreateInput>;
            };

            export type MutationDeleteUsersArgs = {
              where?: InputMaybe<UserWhere>;
            };

            export type MutationUpdateUsersArgs = {
              where?: InputMaybe<UserWhere>;
              update?: InputMaybe<UserUpdateInput>;
            };

            /** An enum for sorting in either ascending or descending order. */
            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            /** Information about the number of nodes and relationships created during a create mutation */
            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type CreateUsersMutationResponse = {
              __typename?: \\"CreateUsersMutationResponse\\";
              info: CreateInfo;
              users: Array<User>;
            };

            /** Information about the number of nodes and relationships deleted during a delete mutation */
            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"][\\"output\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"][\\"output\\"];
              startCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            /** Information about the number of nodes and relationships created and deleted during an update mutation */
            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type UpdateUsersMutationResponse = {
              __typename?: \\"UpdateUsersMutationResponse\\";
              info: UpdateInfo;
              users: Array<User>;
            };

            export type User = {
              __typename?: \\"User\\";
              name?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              name: StringAggregateSelection;
            };

            export type UserEdge = {
              __typename?: \\"UserEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: User;
            };

            export type UsersConnection = {
              __typename?: \\"UsersConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<UserEdge>;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type UserOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type UserWhere = {
              /** @deprecated Please use the explicit _EQ version */
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"][\\"input\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
            };

            export interface UserAggregateSelectionInput {
              count?: boolean;
              name?: boolean;
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

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateUsersMutationResponse>;
              public delete(args: {
                where?: UserWhere;

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

            export interface ModelMap {
              User: UserModel;
            }
            "
        `);
    });

    test("should generate more complex types of two nodes with a relationship and properties and return the string", async () => {
        const typeDefs = `
            type Movie @node {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Person @node {
                name: String!
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        const generated = (await generate({
            ogm,
            noWrite: true,
        })) as string;

        expect(generated).toMatchInlineSnapshot(`
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
              movies: Array<Movie>;
              moviesConnection: MoviesConnection;
              moviesAggregate: MovieAggregateSelection;
              people: Array<Person>;
              peopleConnection: PeopleConnection;
              peopleAggregate: PersonAggregateSelection;
            };

            export type QueryMoviesArgs = {
              where?: InputMaybe<MovieWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<MovieSort>>;
              options?: InputMaybe<MovieOptions>;
            };

            export type QueryMoviesConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<MovieWhere>;
              sort?: InputMaybe<Array<MovieSort>>;
            };

            export type QueryMoviesAggregateArgs = {
              where?: InputMaybe<MovieWhere>;
            };

            export type QueryPeopleArgs = {
              where?: InputMaybe<PersonWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<PersonSort>>;
              options?: InputMaybe<PersonOptions>;
            };

            export type QueryPeopleConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<PersonWhere>;
              sort?: InputMaybe<Array<PersonSort>>;
            };

            export type QueryPeopleAggregateArgs = {
              where?: InputMaybe<PersonWhere>;
            };

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createMovies: CreateMoviesMutationResponse;
              deleteMovies: DeleteInfo;
              updateMovies: UpdateMoviesMutationResponse;
              createPeople: CreatePeopleMutationResponse;
              deletePeople: DeleteInfo;
              updatePeople: UpdatePeopleMutationResponse;
            };

            export type MutationCreateMoviesArgs = {
              input: Array<MovieCreateInput>;
            };

            export type MutationDeleteMoviesArgs = {
              where?: InputMaybe<MovieWhere>;
              delete?: InputMaybe<MovieDeleteInput>;
            };

            export type MutationUpdateMoviesArgs = {
              where?: InputMaybe<MovieWhere>;
              update?: InputMaybe<MovieUpdateInput>;
              connect?: InputMaybe<MovieConnectInput>;
              disconnect?: InputMaybe<MovieDisconnectInput>;
              create?: InputMaybe<MovieRelationInput>;
              delete?: InputMaybe<MovieDeleteInput>;
            };

            export type MutationCreatePeopleArgs = {
              input: Array<PersonCreateInput>;
            };

            export type MutationDeletePeopleArgs = {
              where?: InputMaybe<PersonWhere>;
            };

            export type MutationUpdatePeopleArgs = {
              where?: InputMaybe<PersonWhere>;
              update?: InputMaybe<PersonUpdateInput>;
            };

            /** An enum for sorting in either ascending or descending order. */
            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            /**
             * The edge properties for the following fields:
             * * Movie.actors
             */
            export type ActedIn = {
              __typename?: \\"ActedIn\\";
              screenTime: Scalars[\\"Int\\"][\\"output\\"];
            };

            /** Information about the number of nodes and relationships created during a create mutation */
            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type CreateMoviesMutationResponse = {
              __typename?: \\"CreateMoviesMutationResponse\\";
              info: CreateInfo;
              movies: Array<Movie>;
            };

            export type CreatePeopleMutationResponse = {
              __typename?: \\"CreatePeopleMutationResponse\\";
              info: CreateInfo;
              people: Array<Person>;
            };

            /** Information about the number of nodes and relationships deleted during a delete mutation */
            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type IntAggregateSelection = {
              __typename?: \\"IntAggregateSelection\\";
              max?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
              min?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
              average?: Maybe<Scalars[\\"Float\\"][\\"output\\"]>;
              sum?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
            };

            export type Movie = {
              __typename?: \\"Movie\\";
              title: Scalars[\\"String\\"][\\"output\\"];
              actorsAggregate?: Maybe<MoviePersonActorsAggregationSelection>;
              actors: Array<Person>;
              actorsConnection: MovieActorsConnection;
            };

            export type MovieActorsAggregateArgs = {
              where?: InputMaybe<PersonWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type MovieActorsArgs = {
              where?: InputMaybe<PersonWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<PersonSort>>;
              options?: InputMaybe<PersonOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type MovieActorsConnectionArgs = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<MovieActorsConnectionSort>>;
            };

            export type MovieActorsConnection = {
              __typename?: \\"MovieActorsConnection\\";
              edges: Array<MovieActorsRelationship>;
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
            };

            export type MovieActorsRelationship = {
              __typename?: \\"MovieActorsRelationship\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Person;
              properties: ActedIn;
            };

            export type MovieAggregateSelection = {
              __typename?: \\"MovieAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              title: StringAggregateSelection;
            };

            export type MovieEdge = {
              __typename?: \\"MovieEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Movie;
            };

            export type MoviePersonActorsAggregationSelection = {
              __typename?: \\"MoviePersonActorsAggregationSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              node?: Maybe<MoviePersonActorsNodeAggregateSelection>;
              edge?: Maybe<MoviePersonActorsEdgeAggregateSelection>;
            };

            export type MoviePersonActorsEdgeAggregateSelection = {
              __typename?: \\"MoviePersonActorsEdgeAggregateSelection\\";
              screenTime: IntAggregateSelection;
            };

            export type MoviePersonActorsNodeAggregateSelection = {
              __typename?: \\"MoviePersonActorsNodeAggregateSelection\\";
              name: StringAggregateSelection;
            };

            export type MoviesConnection = {
              __typename?: \\"MoviesConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<MovieEdge>;
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"][\\"output\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"][\\"output\\"];
              startCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type PeopleConnection = {
              __typename?: \\"PeopleConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<PersonEdge>;
            };

            export type Person = {
              __typename?: \\"Person\\";
              name: Scalars[\\"String\\"][\\"output\\"];
            };

            export type PersonAggregateSelection = {
              __typename?: \\"PersonAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              name: StringAggregateSelection;
            };

            export type PersonEdge = {
              __typename?: \\"PersonEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Person;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            /** Information about the number of nodes and relationships created and deleted during an update mutation */
            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type UpdateMoviesMutationResponse = {
              __typename?: \\"UpdateMoviesMutationResponse\\";
              info: UpdateInfo;
              movies: Array<Movie>;
            };

            export type UpdatePeopleMutationResponse = {
              __typename?: \\"UpdatePeopleMutationResponse\\";
              info: UpdateInfo;
              people: Array<Person>;
            };

            export type ActedInAggregationWhereInput = {
              AND?: InputMaybe<Array<ActedInAggregationWhereInput>>;
              OR?: InputMaybe<Array<ActedInAggregationWhereInput>>;
              NOT?: InputMaybe<ActedInAggregationWhereInput>;
              screenTime_MIN_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_MAX_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_SUM_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              screenTime_MIN_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_MAX_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_SUM_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              screenTime_MIN_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_MAX_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_SUM_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              screenTime_MIN_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_MAX_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_SUM_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              screenTime_MIN_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_MAX_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_SUM_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
            };

            export type ActedInCreateInput = {
              screenTime: Scalars[\\"Int\\"][\\"input\\"];
            };

            export type ActedInSort = {
              screenTime?: InputMaybe<SortDirection>;
            };

            export type ActedInUpdateInput = {
              screenTime?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_INCREMENT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_DECREMENT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type ActedInWhere = {
              /** @deprecated Please use the explicit _EQ version */
              screenTime?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_EQ?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_IN?: InputMaybe<Array<Scalars[\\"Int\\"][\\"input\\"]>>;
              screenTime_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              screenTime_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<ActedInWhere>>;
              AND?: InputMaybe<Array<ActedInWhere>>;
              NOT?: InputMaybe<ActedInWhere>;
            };

            export type MovieActorsAggregateInput = {
              count_EQ?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              count?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              AND?: InputMaybe<Array<MovieActorsAggregateInput>>;
              OR?: InputMaybe<Array<MovieActorsAggregateInput>>;
              NOT?: InputMaybe<MovieActorsAggregateInput>;
              node?: InputMaybe<MovieActorsNodeAggregationWhereInput>;
              edge?: InputMaybe<ActedInAggregationWhereInput>;
            };

            export type MovieActorsConnectFieldInput = {
              edge: ActedInCreateInput;
              where?: InputMaybe<PersonConnectWhere>;
              /** Whether or not to overwrite any matching relationship with the new properties. */
              overwrite?: Scalars[\\"Boolean\\"][\\"input\\"];
            };

            export type MovieActorsConnectionSort = {
              node?: InputMaybe<PersonSort>;
              edge?: InputMaybe<ActedInSort>;
            };

            export type MovieActorsConnectionWhere = {
              AND?: InputMaybe<Array<MovieActorsConnectionWhere>>;
              OR?: InputMaybe<Array<MovieActorsConnectionWhere>>;
              NOT?: InputMaybe<MovieActorsConnectionWhere>;
              node?: InputMaybe<PersonWhere>;
              edge?: InputMaybe<ActedInWhere>;
            };

            export type MovieActorsCreateFieldInput = {
              edge: ActedInCreateInput;
              node: PersonCreateInput;
            };

            export type MovieActorsDeleteFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
            };

            export type MovieActorsDisconnectFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
            };

            export type MovieActorsFieldInput = {
              connect?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
              create?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
            };

            export type MovieActorsNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<MovieActorsNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<MovieActorsNodeAggregationWhereInput>>;
              NOT?: InputMaybe<MovieActorsNodeAggregationWhereInput>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
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

            export type MovieActorsUpdateConnectionInput = {
              node?: InputMaybe<PersonUpdateInput>;
              edge?: InputMaybe<ActedInUpdateInput>;
            };

            export type MovieActorsUpdateFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
              connect?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
              disconnect?: InputMaybe<Array<MovieActorsDisconnectFieldInput>>;
              create?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
              update?: InputMaybe<MovieActorsUpdateConnectionInput>;
              delete?: InputMaybe<Array<MovieActorsDeleteFieldInput>>;
            };

            export type MovieConnectInput = {
              actors?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
            };

            export type MovieCreateInput = {
              title: Scalars[\\"String\\"][\\"input\\"];
              actors?: InputMaybe<MovieActorsFieldInput>;
            };

            export type MovieDeleteInput = {
              actors?: InputMaybe<Array<MovieActorsDeleteFieldInput>>;
            };

            export type MovieDisconnectInput = {
              actors?: InputMaybe<Array<MovieActorsDisconnectFieldInput>>;
            };

            export type MovieOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<MovieSort>>;
            };

            export type MovieRelationInput = {
              actors?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
            };

            /** Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object. */
            export type MovieSort = {
              title?: InputMaybe<SortDirection>;
            };

            export type MovieUpdateInput = {
              title?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              actors?: InputMaybe<Array<MovieActorsUpdateFieldInput>>;
            };

            export type MovieWhere = {
              /** @deprecated Please use the explicit _EQ version */
              title?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_IN?: InputMaybe<Array<Scalars[\\"String\\"][\\"input\\"]>>;
              title_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<MovieWhere>>;
              AND?: InputMaybe<Array<MovieWhere>>;
              NOT?: InputMaybe<MovieWhere>;
              /** @deprecated Use \`actors_SOME\` instead. */
              actors?: InputMaybe<PersonWhere>;
              /** Return Movies where all of the related People match this filter */
              actors_ALL?: InputMaybe<PersonWhere>;
              /** Return Movies where none of the related People match this filter */
              actors_NONE?: InputMaybe<PersonWhere>;
              /** Return Movies where one of the related People match this filter */
              actors_SINGLE?: InputMaybe<PersonWhere>;
              /** Return Movies where some of the related People match this filter */
              actors_SOME?: InputMaybe<PersonWhere>;
              /** @deprecated Use \`actorsConnection_SOME\` instead. */
              actorsConnection?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where all of the related MovieActorsConnections match this filter */
              actorsConnection_ALL?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where none of the related MovieActorsConnections match this filter */
              actorsConnection_NONE?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where one of the related MovieActorsConnections match this filter */
              actorsConnection_SINGLE?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where some of the related MovieActorsConnections match this filter */
              actorsConnection_SOME?: InputMaybe<MovieActorsConnectionWhere>;
              actorsAggregate?: InputMaybe<MovieActorsAggregateInput>;
            };

            export type PersonConnectWhere = {
              node: PersonWhere;
            };

            export type PersonCreateInput = {
              name: Scalars[\\"String\\"][\\"input\\"];
            };

            export type PersonOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<PersonSort>>;
            };

            /** Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object. */
            export type PersonSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type PersonUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
            };

            export type PersonWhere = {
              /** @deprecated Please use the explicit _EQ version */
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_IN?: InputMaybe<Array<Scalars[\\"String\\"][\\"input\\"]>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<PersonWhere>>;
              AND?: InputMaybe<Array<PersonWhere>>;
              NOT?: InputMaybe<PersonWhere>;
            };

            export interface MovieAggregateSelectionInput {
              count?: boolean;
              title?: boolean;
            }

            export declare class MovieModel {
              public find(args?: {
                where?: MovieWhere;

                options?: MovieOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<Movie[]>;
              public create(args: {
                input: MovieCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreateMoviesMutationResponse>;
              public update(args: {
                where?: MovieWhere;
                update?: MovieUpdateInput;
                connect?: MovieConnectInput;
                disconnect?: MovieDisconnectInput;
                create?: MovieCreateInput;

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateMoviesMutationResponse>;
              public delete(args: {
                where?: MovieWhere;
                delete?: MovieDeleteInput;
                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: MovieWhere;

                aggregate: MovieAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<MovieAggregateSelection>;
            }

            export interface PersonAggregateSelectionInput {
              count?: boolean;
              name?: boolean;
            }

            export declare class PersonModel {
              public find(args?: {
                where?: PersonWhere;

                options?: PersonOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<Person[]>;
              public create(args: {
                input: PersonCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreatePeopleMutationResponse>;
              public update(args: {
                where?: PersonWhere;
                update?: PersonUpdateInput;

                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdatePeopleMutationResponse>;
              public delete(args: {
                where?: PersonWhere;

                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: PersonWhere;

                aggregate: PersonAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<PersonAggregateSelection>;
            }

            export interface ModelMap {
              Movie: MovieModel;
              Person: PersonModel;
            }
            "
        `);
    });

    test("should throw outFile or noWrite required", async () => {
        const typeDefs = `
          type User @node {
              name: String
          }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        await expect(() =>
            generate({
                ogm,
            })
        ).rejects.toThrow("outFile or noWrite required");
    });

    test("https://github.com/neo4j/graphql/issues/3539", async () => {
        const typeDefs = /* GraphQL */ `
            type FAQ @node {
                id: ID! @id @unique
                activated: Boolean!
                name: String!
                entries: [FAQEntry!]!
                    @relationship(type: "FAQ_ENTRY_IN_FAQ", properties: "FaqEntryInFaq", direction: IN)
            }

            type FAQEntry @node {
                id: ID! @id @unique
                title: String!
                body: String!
                inFAQs: [FAQ!]! @relationship(type: "FAQ_ENTRY_IN_FAQ", properties: "FaqEntryInFaq", direction: OUT)
            }

            type FaqEntryInFaq @relationshipProperties {
                position: Int
            }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        const generated = (await generate({
            ogm,
            noWrite: true,
        })) as string;

        expect(generated).toMatchInlineSnapshot(`
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
              faqs: Array<Faq>;
              faqsConnection: FaqsConnection;
              faqsAggregate: FaqAggregateSelection;
              faqEntries: Array<FaqEntry>;
              faqEntriesConnection: FaqEntriesConnection;
              faqEntriesAggregate: FaqEntryAggregateSelection;
            };

            export type QueryFaqsArgs = {
              where?: InputMaybe<FaqWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<FaqSort>>;
              options?: InputMaybe<FaqOptions>;
            };

            export type QueryFaqsConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<FaqWhere>;
              sort?: InputMaybe<Array<FaqSort>>;
            };

            export type QueryFaqsAggregateArgs = {
              where?: InputMaybe<FaqWhere>;
            };

            export type QueryFaqEntriesArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<FaqEntrySort>>;
              options?: InputMaybe<FaqEntryOptions>;
            };

            export type QueryFaqEntriesConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              where?: InputMaybe<FaqEntryWhere>;
              sort?: InputMaybe<Array<FaqEntrySort>>;
            };

            export type QueryFaqEntriesAggregateArgs = {
              where?: InputMaybe<FaqEntryWhere>;
            };

            export type Mutation = {
              __typename?: \\"Mutation\\";
              createFaqs: CreateFaqsMutationResponse;
              deleteFaqs: DeleteInfo;
              updateFaqs: UpdateFaqsMutationResponse;
              createFaqEntries: CreateFaqEntriesMutationResponse;
              deleteFaqEntries: DeleteInfo;
              updateFaqEntries: UpdateFaqEntriesMutationResponse;
            };

            export type MutationCreateFaqsArgs = {
              input: Array<FaqCreateInput>;
            };

            export type MutationDeleteFaqsArgs = {
              where?: InputMaybe<FaqWhere>;
              delete?: InputMaybe<FaqDeleteInput>;
            };

            export type MutationUpdateFaqsArgs = {
              where?: InputMaybe<FaqWhere>;
              update?: InputMaybe<FaqUpdateInput>;
              connect?: InputMaybe<FaqConnectInput>;
              disconnect?: InputMaybe<FaqDisconnectInput>;
              create?: InputMaybe<FaqRelationInput>;
              delete?: InputMaybe<FaqDeleteInput>;
              connectOrCreate?: InputMaybe<FaqConnectOrCreateInput>;
            };

            export type MutationCreateFaqEntriesArgs = {
              input: Array<FaqEntryCreateInput>;
            };

            export type MutationDeleteFaqEntriesArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              delete?: InputMaybe<FaqEntryDeleteInput>;
            };

            export type MutationUpdateFaqEntriesArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              update?: InputMaybe<FaqEntryUpdateInput>;
              connect?: InputMaybe<FaqEntryConnectInput>;
              disconnect?: InputMaybe<FaqEntryDisconnectInput>;
              create?: InputMaybe<FaqEntryRelationInput>;
              delete?: InputMaybe<FaqEntryDeleteInput>;
              connectOrCreate?: InputMaybe<FaqEntryConnectOrCreateInput>;
            };

            /** An enum for sorting in either ascending or descending order. */
            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            export type CreateFaqEntriesMutationResponse = {
              __typename?: \\"CreateFaqEntriesMutationResponse\\";
              info: CreateInfo;
              faqEntries: Array<FaqEntry>;
            };

            export type CreateFaqsMutationResponse = {
              __typename?: \\"CreateFaqsMutationResponse\\";
              info: CreateInfo;
              faqs: Array<Faq>;
            };

            /** Information about the number of nodes and relationships created during a create mutation */
            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
            };

            /** Information about the number of nodes and relationships deleted during a delete mutation */
            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type Faq = {
              __typename?: \\"FAQ\\";
              id: Scalars[\\"ID\\"][\\"output\\"];
              activated: Scalars[\\"Boolean\\"][\\"output\\"];
              name: Scalars[\\"String\\"][\\"output\\"];
              entriesAggregate?: Maybe<FaqfaqEntryEntriesAggregationSelection>;
              entries: Array<FaqEntry>;
              entriesConnection: FaqEntriesConnection;
            };

            export type FaqEntriesAggregateArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type FaqEntriesArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<FaqEntrySort>>;
              options?: InputMaybe<FaqEntryOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type FaqEntriesConnectionArgs = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<FaqEntriesConnectionSort>>;
            };

            export type FaqAggregateSelection = {
              __typename?: \\"FAQAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              id: IdAggregateSelection;
              name: StringAggregateSelection;
            };

            export type FaqEdge = {
              __typename?: \\"FAQEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Faq;
            };

            export type FaqEntriesConnection = {
              __typename?: \\"FaqEntriesConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<FaqEntryEdge>;
            };

            export type FaqEntriesConnection = {
              __typename?: \\"FAQEntriesConnection\\";
              edges: Array<FaqEntriesRelationship>;
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
            };

            export type FaqEntriesRelationship = {
              __typename?: \\"FAQEntriesRelationship\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: FaqEntry;
              properties: FaqEntryInFaq;
            };

            export type FaqEntry = {
              __typename?: \\"FAQEntry\\";
              id: Scalars[\\"ID\\"][\\"output\\"];
              title: Scalars[\\"String\\"][\\"output\\"];
              body: Scalars[\\"String\\"][\\"output\\"];
              inFAQsAggregate?: Maybe<FaqEntryFaqInFaQsAggregationSelection>;
              inFAQs: Array<Faq>;
              inFAQsConnection: FaqEntryInFaQsConnection;
            };

            export type FaqEntryInFaQsAggregateArgs = {
              where?: InputMaybe<FaqWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type FaqEntryInFaQsArgs = {
              where?: InputMaybe<FaqWhere>;
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<FaqSort>>;
              options?: InputMaybe<FaqOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
            };

            export type FaqEntryInFaQsConnectionArgs = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              sort?: InputMaybe<Array<FaqEntryInFaQsConnectionSort>>;
            };

            export type FaqEntryAggregateSelection = {
              __typename?: \\"FAQEntryAggregateSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              id: IdAggregateSelection;
              title: StringAggregateSelection;
              body: StringAggregateSelection;
            };

            export type FaqEntryEdge = {
              __typename?: \\"FAQEntryEdge\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: FaqEntry;
            };

            export type FaqEntryFaqInFaQsAggregationSelection = {
              __typename?: \\"FAQEntryFAQInFAQsAggregationSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              node?: Maybe<FaqEntryFaqInFaQsNodeAggregateSelection>;
              edge?: Maybe<FaqEntryFaqInFaQsEdgeAggregateSelection>;
            };

            export type FaqEntryFaqInFaQsEdgeAggregateSelection = {
              __typename?: \\"FAQEntryFAQInFAQsEdgeAggregateSelection\\";
              position: IntAggregateSelection;
            };

            export type FaqEntryFaqInFaQsNodeAggregateSelection = {
              __typename?: \\"FAQEntryFAQInFAQsNodeAggregateSelection\\";
              id: IdAggregateSelection;
              name: StringAggregateSelection;
            };

            /**
             * The edge properties for the following fields:
             * * FAQ.entries
             * * FAQEntry.inFAQs
             */
            export type FaqEntryInFaq = {
              __typename?: \\"FaqEntryInFaq\\";
              position?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
            };

            export type FaqEntryInFaQsConnection = {
              __typename?: \\"FAQEntryInFAQsConnection\\";
              edges: Array<FaqEntryInFaQsRelationship>;
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
            };

            export type FaqEntryInFaQsRelationship = {
              __typename?: \\"FAQEntryInFAQsRelationship\\";
              cursor: Scalars[\\"String\\"][\\"output\\"];
              node: Faq;
              properties: FaqEntryInFaq;
            };

            export type FaqfaqEntryEntriesAggregationSelection = {
              __typename?: \\"FAQFAQEntryEntriesAggregationSelection\\";
              count: Scalars[\\"Int\\"][\\"output\\"];
              node?: Maybe<FaqfaqEntryEntriesNodeAggregateSelection>;
              edge?: Maybe<FaqfaqEntryEntriesEdgeAggregateSelection>;
            };

            export type FaqfaqEntryEntriesEdgeAggregateSelection = {
              __typename?: \\"FAQFAQEntryEntriesEdgeAggregateSelection\\";
              position: IntAggregateSelection;
            };

            export type FaqfaqEntryEntriesNodeAggregateSelection = {
              __typename?: \\"FAQFAQEntryEntriesNodeAggregateSelection\\";
              id: IdAggregateSelection;
              title: StringAggregateSelection;
              body: StringAggregateSelection;
            };

            export type FaqsConnection = {
              __typename?: \\"FaqsConnection\\";
              totalCount: Scalars[\\"Int\\"][\\"output\\"];
              pageInfo: PageInfo;
              edges: Array<FaqEdge>;
            };

            export type IdAggregateSelection = {
              __typename?: \\"IDAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"ID\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"ID\\"][\\"output\\"]>;
            };

            export type IntAggregateSelection = {
              __typename?: \\"IntAggregateSelection\\";
              max?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
              min?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
              average?: Maybe<Scalars[\\"Float\\"][\\"output\\"]>;
              sum?: Maybe<Scalars[\\"Int\\"][\\"output\\"]>;
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"][\\"output\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"][\\"output\\"];
              startCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
              shortest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
              longest?: Maybe<Scalars[\\"String\\"][\\"output\\"]>;
            };

            export type UpdateFaqEntriesMutationResponse = {
              __typename?: \\"UpdateFaqEntriesMutationResponse\\";
              info: UpdateInfo;
              faqEntries: Array<FaqEntry>;
            };

            export type UpdateFaqsMutationResponse = {
              __typename?: \\"UpdateFaqsMutationResponse\\";
              info: UpdateInfo;
              faqs: Array<Faq>;
            };

            /** Information about the number of nodes and relationships created and deleted during an update mutation */
            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              nodesCreated: Scalars[\\"Int\\"][\\"output\\"];
              nodesDeleted: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsCreated: Scalars[\\"Int\\"][\\"output\\"];
              relationshipsDeleted: Scalars[\\"Int\\"][\\"output\\"];
            };

            export type FaqConnectInput = {
              entries?: InputMaybe<Array<FaqEntriesConnectFieldInput>>;
            };

            export type FaqConnectOrCreateInput = {
              entries?: InputMaybe<Array<FaqEntriesConnectOrCreateFieldInput>>;
            };

            export type FaqConnectOrCreateWhere = {
              node: FaqUniqueWhere;
            };

            export type FaqConnectWhere = {
              node: FaqWhere;
            };

            export type FaqCreateInput = {
              activated: Scalars[\\"Boolean\\"][\\"input\\"];
              name: Scalars[\\"String\\"][\\"input\\"];
              entries?: InputMaybe<FaqEntriesFieldInput>;
            };

            export type FaqDeleteInput = {
              entries?: InputMaybe<Array<FaqEntriesDeleteFieldInput>>;
            };

            export type FaqDisconnectInput = {
              entries?: InputMaybe<Array<FaqEntriesDisconnectFieldInput>>;
            };

            export type FaqEntriesAggregateInput = {
              count_EQ?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              count?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              AND?: InputMaybe<Array<FaqEntriesAggregateInput>>;
              OR?: InputMaybe<Array<FaqEntriesAggregateInput>>;
              NOT?: InputMaybe<FaqEntriesAggregateInput>;
              node?: InputMaybe<FaqEntriesNodeAggregationWhereInput>;
              edge?: InputMaybe<FaqEntryInFaqAggregationWhereInput>;
            };

            export type FaqEntriesConnectFieldInput = {
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
              where?: InputMaybe<FaqEntryConnectWhere>;
              /** Whether or not to overwrite any matching relationship with the new properties. */
              overwrite?: Scalars[\\"Boolean\\"][\\"input\\"];
              connect?: InputMaybe<Array<FaqEntryConnectInput>>;
            };

            export type FaqEntriesConnectionSort = {
              node?: InputMaybe<FaqEntrySort>;
              edge?: InputMaybe<FaqEntryInFaqSort>;
            };

            export type FaqEntriesConnectionWhere = {
              AND?: InputMaybe<Array<FaqEntriesConnectionWhere>>;
              OR?: InputMaybe<Array<FaqEntriesConnectionWhere>>;
              NOT?: InputMaybe<FaqEntriesConnectionWhere>;
              node?: InputMaybe<FaqEntryWhere>;
              edge?: InputMaybe<FaqEntryInFaqWhere>;
            };

            export type FaqEntriesConnectOrCreateFieldInput = {
              where: FaqEntryConnectOrCreateWhere;
              onCreate: FaqEntriesConnectOrCreateFieldInputOnCreate;
            };

            export type FaqEntriesConnectOrCreateFieldInputOnCreate = {
              node: FaqEntryOnCreateInput;
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
            };

            export type FaqEntriesCreateFieldInput = {
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
              node: FaqEntryCreateInput;
            };

            export type FaqEntriesDeleteFieldInput = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              delete?: InputMaybe<FaqEntryDeleteInput>;
            };

            export type FaqEntriesDisconnectFieldInput = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              disconnect?: InputMaybe<FaqEntryDisconnectInput>;
            };

            export type FaqEntriesFieldInput = {
              connectOrCreate?: InputMaybe<Array<FaqEntriesConnectOrCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntriesConnectFieldInput>>;
              create?: InputMaybe<Array<FaqEntriesCreateFieldInput>>;
            };

            export type FaqEntriesNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntriesNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntriesNodeAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntriesNodeAggregationWhereInput>;
              id_MIN_EQUAL?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_EQUAL?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_GT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_GT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_GTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_GTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_LT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_LT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_LTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_LTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              title_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              title_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              title_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              title_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              title_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              title_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              body_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              body_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              body_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              body_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              body_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              body_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type FaqEntriesUpdateConnectionInput = {
              node?: InputMaybe<FaqEntryUpdateInput>;
              edge?: InputMaybe<FaqEntryInFaqUpdateInput>;
            };

            export type FaqEntriesUpdateFieldInput = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              connectOrCreate?: InputMaybe<Array<FaqEntriesConnectOrCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntriesConnectFieldInput>>;
              disconnect?: InputMaybe<Array<FaqEntriesDisconnectFieldInput>>;
              create?: InputMaybe<Array<FaqEntriesCreateFieldInput>>;
              update?: InputMaybe<FaqEntriesUpdateConnectionInput>;
              delete?: InputMaybe<Array<FaqEntriesDeleteFieldInput>>;
            };

            export type FaqEntryConnectInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsConnectFieldInput>>;
            };

            export type FaqEntryConnectOrCreateInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsConnectOrCreateFieldInput>>;
            };

            export type FaqEntryConnectOrCreateWhere = {
              node: FaqEntryUniqueWhere;
            };

            export type FaqEntryConnectWhere = {
              node: FaqEntryWhere;
            };

            export type FaqEntryCreateInput = {
              title: Scalars[\\"String\\"][\\"input\\"];
              body: Scalars[\\"String\\"][\\"input\\"];
              inFAQs?: InputMaybe<FaqEntryInFaQsFieldInput>;
            };

            export type FaqEntryDeleteInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsDeleteFieldInput>>;
            };

            export type FaqEntryDisconnectInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsDisconnectFieldInput>>;
            };

            export type FaqEntryInFaqAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntryInFaqAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntryInFaqAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntryInFaqAggregationWhereInput>;
              position_MIN_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_MAX_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_SUM_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              position_MIN_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_MAX_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_SUM_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              position_MIN_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_MAX_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_SUM_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              position_MIN_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_MAX_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_SUM_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              position_MIN_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_MAX_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_SUM_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
            };

            export type FaqEntryInFaqCreateInput = {
              position?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type FaqEntryInFaQsAggregateInput = {
              count_EQ?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              count?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              AND?: InputMaybe<Array<FaqEntryInFaQsAggregateInput>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsAggregateInput>>;
              NOT?: InputMaybe<FaqEntryInFaQsAggregateInput>;
              node?: InputMaybe<FaqEntryInFaQsNodeAggregationWhereInput>;
              edge?: InputMaybe<FaqEntryInFaqAggregationWhereInput>;
            };

            export type FaqEntryInFaQsConnectFieldInput = {
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
              where?: InputMaybe<FaqConnectWhere>;
              /** Whether or not to overwrite any matching relationship with the new properties. */
              overwrite?: Scalars[\\"Boolean\\"][\\"input\\"];
              connect?: InputMaybe<Array<FaqConnectInput>>;
            };

            export type FaqEntryInFaQsConnectionSort = {
              node?: InputMaybe<FaqSort>;
              edge?: InputMaybe<FaqEntryInFaqSort>;
            };

            export type FaqEntryInFaQsConnectionWhere = {
              AND?: InputMaybe<Array<FaqEntryInFaQsConnectionWhere>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsConnectionWhere>>;
              NOT?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              node?: InputMaybe<FaqWhere>;
              edge?: InputMaybe<FaqEntryInFaqWhere>;
            };

            export type FaqEntryInFaQsConnectOrCreateFieldInput = {
              where: FaqConnectOrCreateWhere;
              onCreate: FaqEntryInFaQsConnectOrCreateFieldInputOnCreate;
            };

            export type FaqEntryInFaQsConnectOrCreateFieldInputOnCreate = {
              node: FaqOnCreateInput;
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
            };

            export type FaqEntryInFaQsCreateFieldInput = {
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
              node: FaqCreateInput;
            };

            export type FaqEntryInFaQsDeleteFieldInput = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              delete?: InputMaybe<FaqDeleteInput>;
            };

            export type FaqEntryInFaQsDisconnectFieldInput = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              disconnect?: InputMaybe<FaqDisconnectInput>;
            };

            export type FaqEntryInFaQsFieldInput = {
              connectOrCreate?: InputMaybe<Array<FaqEntryInFaQsConnectOrCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntryInFaQsConnectFieldInput>>;
              create?: InputMaybe<Array<FaqEntryInFaQsCreateFieldInput>>;
            };

            export type FaqEntryInFaQsNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntryInFaQsNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsNodeAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntryInFaQsNodeAggregationWhereInput>;
              id_MIN_EQUAL?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_EQUAL?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_GT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_GT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_GTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_GTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_LT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_LT?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MIN_LTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_MAX_LTE?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"][\\"input\\"]>;
              name_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              name_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
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

            export type FaqEntryInFaqSort = {
              position?: InputMaybe<SortDirection>;
            };

            export type FaqEntryInFaQsUpdateConnectionInput = {
              node?: InputMaybe<FaqUpdateInput>;
              edge?: InputMaybe<FaqEntryInFaqUpdateInput>;
            };

            export type FaqEntryInFaQsUpdateFieldInput = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              connectOrCreate?: InputMaybe<Array<FaqEntryInFaQsConnectOrCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntryInFaQsConnectFieldInput>>;
              disconnect?: InputMaybe<Array<FaqEntryInFaQsDisconnectFieldInput>>;
              create?: InputMaybe<Array<FaqEntryInFaQsCreateFieldInput>>;
              update?: InputMaybe<FaqEntryInFaQsUpdateConnectionInput>;
              delete?: InputMaybe<Array<FaqEntryInFaQsDeleteFieldInput>>;
            };

            export type FaqEntryInFaqUpdateInput = {
              position?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_INCREMENT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_DECREMENT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
            };

            export type FaqEntryInFaqWhere = {
              /** @deprecated Please use the explicit _EQ version */
              position?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_EQ?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>>>;
              position_LT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_LTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_GT?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              position_GTE?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<FaqEntryInFaqWhere>>;
              AND?: InputMaybe<Array<FaqEntryInFaqWhere>>;
              NOT?: InputMaybe<FaqEntryInFaqWhere>;
            };

            export type FaqEntryOnCreateInput = {
              title: Scalars[\\"String\\"][\\"input\\"];
              body: Scalars[\\"String\\"][\\"input\\"];
            };

            export type FaqEntryOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more FAQEntrySort objects to sort FaqEntries by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<FaqEntrySort>>;
            };

            export type FaqEntryRelationInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsCreateFieldInput>>;
            };

            /** Fields to sort FaqEntries by. The order in which sorts are applied is not guaranteed when specifying many fields in one FAQEntrySort object. */
            export type FaqEntrySort = {
              id?: InputMaybe<SortDirection>;
              title?: InputMaybe<SortDirection>;
              body?: InputMaybe<SortDirection>;
            };

            export type FaqEntryUniqueWhere = {
              /** @deprecated Please use the explicit _EQ version */
              id?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_EQ?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
            };

            export type FaqEntryUpdateInput = {
              title?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              body?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsUpdateFieldInput>>;
            };

            export type FaqEntryWhere = {
              /** @deprecated Please use the explicit _EQ version */
              id?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_EQ?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_IN?: InputMaybe<Array<Scalars[\\"ID\\"][\\"input\\"]>>;
              id_CONTAINS?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              title?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_IN?: InputMaybe<Array<Scalars[\\"String\\"][\\"input\\"]>>;
              title_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              title_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              body?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              body_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              body_IN?: InputMaybe<Array<Scalars[\\"String\\"][\\"input\\"]>>;
              body_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              body_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              body_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<FaqEntryWhere>>;
              AND?: InputMaybe<Array<FaqEntryWhere>>;
              NOT?: InputMaybe<FaqEntryWhere>;
              /** @deprecated Use \`inFAQs_SOME\` instead. */
              inFAQs?: InputMaybe<FaqWhere>;
              /** Return FAQEntries where all of the related FAQS match this filter */
              inFAQs_ALL?: InputMaybe<FaqWhere>;
              /** Return FAQEntries where none of the related FAQS match this filter */
              inFAQs_NONE?: InputMaybe<FaqWhere>;
              /** Return FAQEntries where one of the related FAQS match this filter */
              inFAQs_SINGLE?: InputMaybe<FaqWhere>;
              /** Return FAQEntries where some of the related FAQS match this filter */
              inFAQs_SOME?: InputMaybe<FaqWhere>;
              /** @deprecated Use \`inFAQsConnection_SOME\` instead. */
              inFAQsConnection?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where all of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_ALL?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where none of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_NONE?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where one of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_SINGLE?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where some of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_SOME?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              inFAQsAggregate?: InputMaybe<FaqEntryInFaQsAggregateInput>;
            };

            export type FaqOnCreateInput = {
              activated: Scalars[\\"Boolean\\"][\\"input\\"];
              name: Scalars[\\"String\\"][\\"input\\"];
            };

            export type FaqOptions = {
              limit?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"][\\"input\\"]>;
              /** Specify one or more FAQSort objects to sort Faqs by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<FaqSort>>;
            };

            export type FaqRelationInput = {
              entries?: InputMaybe<Array<FaqEntriesCreateFieldInput>>;
            };

            /** Fields to sort Faqs by. The order in which sorts are applied is not guaranteed when specifying many fields in one FAQSort object. */
            export type FaqSort = {
              id?: InputMaybe<SortDirection>;
              activated?: InputMaybe<SortDirection>;
              name?: InputMaybe<SortDirection>;
            };

            export type FaqUniqueWhere = {
              /** @deprecated Please use the explicit _EQ version */
              id?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_EQ?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
            };

            export type FaqUpdateInput = {
              activated?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              entries?: InputMaybe<Array<FaqEntriesUpdateFieldInput>>;
            };

            export type FaqWhere = {
              /** @deprecated Please use the explicit _EQ version */
              id?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_EQ?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_IN?: InputMaybe<Array<Scalars[\\"ID\\"][\\"input\\"]>>;
              id_CONTAINS?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_STARTS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              id_ENDS_WITH?: InputMaybe<Scalars[\\"ID\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              activated?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              activated_EQ?: InputMaybe<Scalars[\\"Boolean\\"][\\"input\\"]>;
              /** @deprecated Please use the explicit _EQ version */
              name?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_EQ?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_IN?: InputMaybe<Array<Scalars[\\"String\\"][\\"input\\"]>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"][\\"input\\"]>;
              OR?: InputMaybe<Array<FaqWhere>>;
              AND?: InputMaybe<Array<FaqWhere>>;
              NOT?: InputMaybe<FaqWhere>;
              /** @deprecated Use \`entries_SOME\` instead. */
              entries?: InputMaybe<FaqEntryWhere>;
              /** Return FAQS where all of the related FAQEntries match this filter */
              entries_ALL?: InputMaybe<FaqEntryWhere>;
              /** Return FAQS where none of the related FAQEntries match this filter */
              entries_NONE?: InputMaybe<FaqEntryWhere>;
              /** Return FAQS where one of the related FAQEntries match this filter */
              entries_SINGLE?: InputMaybe<FaqEntryWhere>;
              /** Return FAQS where some of the related FAQEntries match this filter */
              entries_SOME?: InputMaybe<FaqEntryWhere>;
              /** @deprecated Use \`entriesConnection_SOME\` instead. */
              entriesConnection?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where all of the related FAQEntriesConnections match this filter */
              entriesConnection_ALL?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where none of the related FAQEntriesConnections match this filter */
              entriesConnection_NONE?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where one of the related FAQEntriesConnections match this filter */
              entriesConnection_SINGLE?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where some of the related FAQEntriesConnections match this filter */
              entriesConnection_SOME?: InputMaybe<FaqEntriesConnectionWhere>;
              entriesAggregate?: InputMaybe<FaqEntriesAggregateInput>;
            };

            export interface FAQAggregateSelectionInput {
              count?: boolean;
              id?: boolean;
              name?: boolean;
            }

            export declare class FAQModel {
              public find(args?: {
                where?: FaqWhere;

                options?: FaqOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<Faq[]>;
              public create(args: {
                input: FaqCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreateFaqsMutationResponse>;
              public update(args: {
                where?: FaqWhere;
                update?: FaqUpdateInput;
                connect?: FaqConnectInput;
                disconnect?: FaqDisconnectInput;
                create?: FaqCreateInput;
                connectOrCreate?: FaqConnectOrCreateInput;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateFaqsMutationResponse>;
              public delete(args: {
                where?: FaqWhere;
                delete?: FaqDeleteInput;
                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: FaqWhere;

                aggregate: FAQAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<FaqAggregateSelection>;
            }

            export interface FAQEntryAggregateSelectionInput {
              count?: boolean;
              id?: boolean;
              title?: boolean;
              body?: boolean;
            }

            export declare class FAQEntryModel {
              public find(args?: {
                where?: FaqEntryWhere;

                options?: FaqEntryOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<FaqEntry[]>;
              public create(args: {
                input: FaqEntryCreateInput[];
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<CreateFaqEntriesMutationResponse>;
              public update(args: {
                where?: FaqEntryWhere;
                update?: FaqEntryUpdateInput;
                connect?: FaqEntryConnectInput;
                disconnect?: FaqEntryDisconnectInput;
                create?: FaqEntryCreateInput;
                connectOrCreate?: FaqEntryConnectOrCreateInput;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<UpdateFaqEntriesMutationResponse>;
              public delete(args: {
                where?: FaqEntryWhere;
                delete?: FaqEntryDeleteInput;
                context?: any;
                rootValue?: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: FaqEntryWhere;

                aggregate: FAQEntryAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<FaqEntryAggregateSelection>;
            }

            export interface ModelMap {
              FAQ: FAQModel;
              FAQEntry: FAQEntryModel;
            }
            "
        `);
    });
});
