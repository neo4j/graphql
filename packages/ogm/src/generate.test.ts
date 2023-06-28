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

import { generate as randomstring } from "randomstring";
import * as fs from "fs";
import * as path from "path";
import generate from "./generate";
import { OGM } from "./index";
import gql from "graphql-tag";

describe("generate", () => {
    const filesToDelete: string[] = [];

    afterAll(async () => {
        await Promise.all(filesToDelete.map((name) => fs.promises.unlink(name)));
    });

    test("should generate simple types of a single node and return the string", async () => {
        const typeDefs = `
            type User {
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
            /** All built-in and custom scalars, mapped to their actual values */
            export type Scalars = {
              ID: string;
              /** The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
              String: string;
              /** The \`Boolean\` scalar type represents \`true\` or \`false\`. */
              Boolean: boolean;
              /** The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
              Int: number;
              Float: number;
            };

            export type Query = {
              __typename?: \\"Query\\";
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
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

            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

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
              name?: Maybe<Scalars[\\"String\\"]>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              name: StringAggregateSelectionNullable;
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

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserOptions = {
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserWhere = {
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInputNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateSelectionInput {
              count?: boolean;
              name?: StringAggregateInputNullable;
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
            type User {
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
            /** All built-in and custom scalars, mapped to their actual values */
            export type Scalars = {
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
              usersFulltextUserName: Array<UserFulltextResult>;
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
            };

            export type QueryUsersFulltextUserNameArgs = {
              phrase: Scalars[\\"String\\"];
              where?: InputMaybe<UserFulltextWhere>;
              sort?: InputMaybe<Array<UserFulltextSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              options?: InputMaybe<UserOptions>;
              fulltext?: InputMaybe<UserFulltext>;
            };

            export type QueryUsersConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<UserWhere>;
              sort?: InputMaybe<Array<InputMaybe<UserSort>>>;
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

            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

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
              name?: Maybe<Scalars[\\"String\\"]>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              name: StringAggregateSelectionNullable;
            };

            export type UserEdge = {
              __typename?: \\"UserEdge\\";
              cursor: Scalars[\\"String\\"];
              node: User;
            };

            /** The result of a fulltext search on an index of User */
            export type UserFulltextResult = {
              __typename?: \\"UserFulltextResult\\";
              score: Scalars[\\"Float\\"];
              user: User;
            };

            export type UsersConnection = {
              __typename?: \\"UsersConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<UserEdge>;
            };

            /** The input for filtering a float */
            export type FloatWhere = {
              min?: InputMaybe<Scalars[\\"Float\\"]>;
              max?: InputMaybe<Scalars[\\"Float\\"]>;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
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
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserUserNameFulltext = {
              phrase: Scalars[\\"String\\"];
            };

            export type UserWhere = {
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInputNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateSelectionInput {
              count?: boolean;
              name?: StringAggregateInputNullable;
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
            type User {
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
            /** All built-in and custom scalars, mapped to their actual values */
            export type Scalars = {
              ID: string;
              /** The \`String\` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
              String: string;
              /** The \`Boolean\` scalar type represents \`true\` or \`false\`. */
              Boolean: boolean;
              /** The \`Int\` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
              Int: number;
              Float: number;
            };

            export type Query = {
              __typename?: \\"Query\\";
              users: Array<User>;
              usersConnection: UsersConnection;
              usersAggregate: UserAggregateSelection;
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

            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

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
              name?: Maybe<Scalars[\\"String\\"]>;
            };

            export type UserAggregateSelection = {
              __typename?: \\"UserAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              name: StringAggregateSelectionNullable;
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

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserOptions = {
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<UserSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
            export type UserSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type UserUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserWhere = {
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              NOT?: InputMaybe<UserWhere>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInputNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateSelectionInput {
              count?: boolean;
              name?: StringAggregateInputNullable;
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
            type Movie {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Person {
                name: String!
            }
            interface ActedIn {
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
            /** All built-in and custom scalars, mapped to their actual values */
            export type Scalars = {
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
              movies: Array<Movie>;
              moviesConnection: MoviesConnection;
              moviesAggregate: MovieAggregateSelection;
              people: Array<Person>;
              peopleConnection: PeopleConnection;
              peopleAggregate: PersonAggregateSelection;
            };

            export type QueryMoviesArgs = {
              where?: InputMaybe<MovieWhere>;
              options?: InputMaybe<MovieOptions>;
            };

            export type QueryMoviesConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<MovieWhere>;
              sort?: InputMaybe<Array<InputMaybe<MovieSort>>>;
            };

            export type QueryMoviesAggregateArgs = {
              where?: InputMaybe<MovieWhere>;
            };

            export type QueryPeopleArgs = {
              where?: InputMaybe<PersonWhere>;
              options?: InputMaybe<PersonOptions>;
            };

            export type QueryPeopleConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<PersonWhere>;
              sort?: InputMaybe<Array<InputMaybe<PersonSort>>>;
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

            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            export type ActedIn = {
              screenTime: Scalars[\\"Int\\"];
            };

            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesCreated: Scalars[\\"Int\\"];
              relationshipsCreated: Scalars[\\"Int\\"];
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

            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesDeleted: Scalars[\\"Int\\"];
              relationshipsDeleted: Scalars[\\"Int\\"];
            };

            export type IntAggregateSelectionNonNullable = {
              __typename?: \\"IntAggregateSelectionNonNullable\\";
              max: Scalars[\\"Int\\"];
              min: Scalars[\\"Int\\"];
              average: Scalars[\\"Float\\"];
              sum: Scalars[\\"Int\\"];
            };

            export type Movie = {
              __typename?: \\"Movie\\";
              title: Scalars[\\"String\\"];
              actors: Array<Person>;
              actorsAggregate?: Maybe<MoviePersonActorsAggregationSelection>;
              actorsConnection: MovieActorsConnection;
            };

            export type MovieActorsArgs = {
              where?: InputMaybe<PersonWhere>;
              options?: InputMaybe<PersonOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type MovieActorsAggregateArgs = {
              where?: InputMaybe<PersonWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type MovieActorsConnectionArgs = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
              sort?: InputMaybe<Array<MovieActorsConnectionSort>>;
            };

            export type MovieActorsConnection = {
              __typename?: \\"MovieActorsConnection\\";
              edges: Array<MovieActorsRelationship>;
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
            };

            export type MovieActorsRelationship = ActedIn & {
              __typename?: \\"MovieActorsRelationship\\";
              cursor: Scalars[\\"String\\"];
              node: Person;
              screenTime: Scalars[\\"Int\\"];
            };

            export type MovieAggregateSelection = {
              __typename?: \\"MovieAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              title: StringAggregateSelectionNonNullable;
            };

            export type MovieEdge = {
              __typename?: \\"MovieEdge\\";
              cursor: Scalars[\\"String\\"];
              node: Movie;
            };

            export type MoviePersonActorsAggregationSelection = {
              __typename?: \\"MoviePersonActorsAggregationSelection\\";
              count: Scalars[\\"Int\\"];
              node?: Maybe<MoviePersonActorsNodeAggregateSelection>;
              edge?: Maybe<MoviePersonActorsEdgeAggregateSelection>;
            };

            export type MoviePersonActorsEdgeAggregateSelection = {
              __typename?: \\"MoviePersonActorsEdgeAggregateSelection\\";
              screenTime: IntAggregateSelectionNonNullable;
            };

            export type MoviePersonActorsNodeAggregateSelection = {
              __typename?: \\"MoviePersonActorsNodeAggregateSelection\\";
              name: StringAggregateSelectionNonNullable;
            };

            export type MoviesConnection = {
              __typename?: \\"MoviesConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<MovieEdge>;
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"];
              startCursor?: Maybe<Scalars[\\"String\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"]>;
            };

            export type PeopleConnection = {
              __typename?: \\"PeopleConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<PersonEdge>;
            };

            export type Person = {
              __typename?: \\"Person\\";
              name: Scalars[\\"String\\"];
            };

            export type PersonAggregateSelection = {
              __typename?: \\"PersonAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              name: StringAggregateSelectionNonNullable;
            };

            export type PersonEdge = {
              __typename?: \\"PersonEdge\\";
              cursor: Scalars[\\"String\\"];
              node: Person;
            };

            export type StringAggregateSelectionNonNullable = {
              __typename?: \\"StringAggregateSelectionNonNullable\\";
              shortest: Scalars[\\"String\\"];
              longest: Scalars[\\"String\\"];
            };

            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesCreated: Scalars[\\"Int\\"];
              nodesDeleted: Scalars[\\"Int\\"];
              relationshipsCreated: Scalars[\\"Int\\"];
              relationshipsDeleted: Scalars[\\"Int\\"];
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

            export type ActedInCreateInput = {
              screenTime: Scalars[\\"Int\\"];
            };

            export type ActedInSort = {
              screenTime?: InputMaybe<SortDirection>;
            };

            export type ActedInUpdateInput = {
              screenTime?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_INCREMENT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_DECREMENT?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type ActedInWhere = {
              OR?: InputMaybe<Array<ActedInWhere>>;
              AND?: InputMaybe<Array<ActedInWhere>>;
              NOT?: InputMaybe<ActedInWhere>;
              screenTime?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              screenTime_NOT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_IN?: InputMaybe<Array<Scalars[\\"Int\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              screenTime_NOT_IN?: InputMaybe<Array<Scalars[\\"Int\\"]>>;
              screenTime_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type MovieActorsAggregateInput = {
              count?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              AND?: InputMaybe<Array<MovieActorsAggregateInput>>;
              OR?: InputMaybe<Array<MovieActorsAggregateInput>>;
              NOT?: InputMaybe<MovieActorsAggregateInput>;
              node?: InputMaybe<MovieActorsNodeAggregationWhereInput>;
              edge?: InputMaybe<MovieActorsEdgeAggregationWhereInput>;
            };

            export type MovieActorsConnectFieldInput = {
              where?: InputMaybe<PersonConnectWhere>;
              edge: ActedInCreateInput;
              /** Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0. */
              overwrite?: Scalars[\\"Boolean\\"];
            };

            export type MovieActorsConnectionSort = {
              edge?: InputMaybe<ActedInSort>;
              node?: InputMaybe<PersonSort>;
            };

            export type MovieActorsConnectionWhere = {
              AND?: InputMaybe<Array<MovieActorsConnectionWhere>>;
              OR?: InputMaybe<Array<MovieActorsConnectionWhere>>;
              NOT?: InputMaybe<MovieActorsConnectionWhere>;
              edge?: InputMaybe<ActedInWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              edge_NOT?: InputMaybe<ActedInWhere>;
              node?: InputMaybe<PersonWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              node_NOT?: InputMaybe<PersonWhere>;
            };

            export type MovieActorsCreateFieldInput = {
              node: PersonCreateInput;
              edge: ActedInCreateInput;
            };

            export type MovieActorsDeleteFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
            };

            export type MovieActorsDisconnectFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
            };

            export type MovieActorsEdgeAggregationWhereInput = {
              AND?: InputMaybe<Array<MovieActorsEdgeAggregationWhereInput>>;
              OR?: InputMaybe<Array<MovieActorsEdgeAggregationWhereInput>>;
              NOT?: InputMaybe<MovieActorsEdgeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              screenTime_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              screenTime_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              screenTime_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              screenTime_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              screenTime_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type MovieActorsFieldInput = {
              create?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
              connect?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
            };

            export type MovieActorsNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<MovieActorsNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<MovieActorsNodeAggregationWhereInput>>;
              NOT?: InputMaybe<MovieActorsNodeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type MovieActorsUpdateConnectionInput = {
              node?: InputMaybe<PersonUpdateInput>;
              edge?: InputMaybe<ActedInUpdateInput>;
            };

            export type MovieActorsUpdateFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
              create?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
              connect?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
              update?: InputMaybe<MovieActorsUpdateConnectionInput>;
              delete?: InputMaybe<Array<MovieActorsDeleteFieldInput>>;
              disconnect?: InputMaybe<Array<MovieActorsDisconnectFieldInput>>;
            };

            export type MovieConnectInput = {
              actors?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
            };

            export type MovieCreateInput = {
              title: Scalars[\\"String\\"];
              actors?: InputMaybe<MovieActorsFieldInput>;
            };

            export type MovieDeleteInput = {
              actors?: InputMaybe<Array<MovieActorsDeleteFieldInput>>;
            };

            export type MovieDisconnectInput = {
              actors?: InputMaybe<Array<MovieActorsDisconnectFieldInput>>;
            };

            export type MovieOptions = {
              /** Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<MovieSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type MovieRelationInput = {
              actors?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
            };

            /** Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object. */
            export type MovieSort = {
              title?: InputMaybe<SortDirection>;
            };

            export type MovieUpdateInput = {
              title?: InputMaybe<Scalars[\\"String\\"]>;
              actors?: InputMaybe<Array<MovieActorsUpdateFieldInput>>;
            };

            export type MovieWhere = {
              OR?: InputMaybe<Array<MovieWhere>>;
              AND?: InputMaybe<Array<MovieWhere>>;
              NOT?: InputMaybe<MovieWhere>;
              title?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              title_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              title_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              title_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              title_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Use \`actors_SOME\` instead. */
              actors?: InputMaybe<PersonWhere>;
              /** @deprecated Use \`actors_NONE\` instead. */
              actors_NOT?: InputMaybe<PersonWhere>;
              actorsAggregate?: InputMaybe<MovieActorsAggregateInput>;
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
              /** @deprecated Use \`actorsConnection_NONE\` instead. */
              actorsConnection_NOT?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where all of the related MovieActorsConnections match this filter */
              actorsConnection_ALL?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where none of the related MovieActorsConnections match this filter */
              actorsConnection_NONE?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where one of the related MovieActorsConnections match this filter */
              actorsConnection_SINGLE?: InputMaybe<MovieActorsConnectionWhere>;
              /** Return Movies where some of the related MovieActorsConnections match this filter */
              actorsConnection_SOME?: InputMaybe<MovieActorsConnectionWhere>;
            };

            export type PersonConnectWhere = {
              node: PersonWhere;
            };

            export type PersonCreateInput = {
              name: Scalars[\\"String\\"];
            };

            export type PersonOptions = {
              /** Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<PersonSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            /** Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object. */
            export type PersonSort = {
              name?: InputMaybe<SortDirection>;
            };

            export type PersonUpdateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type PersonWhere = {
              OR?: InputMaybe<Array<PersonWhere>>;
              AND?: InputMaybe<Array<PersonWhere>>;
              NOT?: InputMaybe<PersonWhere>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface MovieAggregateSelectionInput {
              count?: boolean;
              title?: StringAggregateInputNonNullable;
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

            export interface StringAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface PersonAggregateSelectionInput {
              count?: boolean;
              name?: StringAggregateInputNonNullable;
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
          type User {
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
        const typeDefs = gql`
            type FAQ {
                id: ID! @id
                activated: Boolean!
                name: String!
                entries: [FAQEntry!]!
                    @relationship(type: "FAQ_ENTRY_IN_FAQ", properties: "FaqEntryInFaq", direction: IN)
            }

            type FAQEntry {
                id: ID! @id
                title: String!
                body: String!
                inFAQs: [FAQ!]! @relationship(type: "FAQ_ENTRY_IN_FAQ", properties: "FaqEntryInFaq", direction: OUT)
            }

            interface FaqEntryInFaq @relationshipProperties {
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
              faqs: Array<Faq>;
              faqsConnection: FaqsConnection;
              faqsAggregate: FaqAggregateSelection;
              faqEntries: Array<FaqEntry>;
              faqEntriesConnection: FaqEntriesConnection;
              faqEntriesAggregate: FaqEntryAggregateSelection;
            };

            export type QueryFaqsArgs = {
              where?: InputMaybe<FaqWhere>;
              options?: InputMaybe<FaqOptions>;
            };

            export type QueryFaqsConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<FaqWhere>;
              sort?: InputMaybe<Array<InputMaybe<FaqSort>>>;
            };

            export type QueryFaqsAggregateArgs = {
              where?: InputMaybe<FaqWhere>;
            };

            export type QueryFaqEntriesArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              options?: InputMaybe<FaqEntryOptions>;
            };

            export type QueryFaqEntriesConnectionArgs = {
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              where?: InputMaybe<FaqEntryWhere>;
              sort?: InputMaybe<Array<InputMaybe<FaqEntrySort>>>;
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

            export enum SortDirection {
              /** Sort by field values in ascending order. */
              Asc = \\"ASC\\",
              /** Sort by field values in descending order. */
              Desc = \\"DESC\\",
            }

            export type FaqEntryInFaq = {
              position?: Maybe<Scalars[\\"Int\\"]>;
            };

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

            export type CreateInfo = {
              __typename?: \\"CreateInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesCreated: Scalars[\\"Int\\"];
              relationshipsCreated: Scalars[\\"Int\\"];
            };

            export type DeleteInfo = {
              __typename?: \\"DeleteInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesDeleted: Scalars[\\"Int\\"];
              relationshipsDeleted: Scalars[\\"Int\\"];
            };

            export type Faq = {
              __typename?: \\"FAQ\\";
              id: Scalars[\\"ID\\"];
              activated: Scalars[\\"Boolean\\"];
              name: Scalars[\\"String\\"];
              entries: Array<FaqEntry>;
              entriesAggregate?: Maybe<FaqfaqEntryEntriesAggregationSelection>;
              entriesConnection: FaqEntriesConnection;
            };

            export type FaqEntriesArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              options?: InputMaybe<FaqEntryOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type FaqEntriesAggregateArgs = {
              where?: InputMaybe<FaqEntryWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type FaqEntriesConnectionArgs = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
              sort?: InputMaybe<Array<FaqEntriesConnectionSort>>;
            };

            export type FaqAggregateSelection = {
              __typename?: \\"FAQAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              id: IdAggregateSelectionNonNullable;
              name: StringAggregateSelectionNonNullable;
            };

            export type FaqEdge = {
              __typename?: \\"FAQEdge\\";
              cursor: Scalars[\\"String\\"];
              node: Faq;
            };

            export type FaqEntriesConnection = {
              __typename?: \\"FaqEntriesConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<FaqEntryEdge>;
            };

            export type FaqEntriesConnection = {
              __typename?: \\"FAQEntriesConnection\\";
              edges: Array<FaqEntriesRelationship>;
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
            };

            export type FaqEntriesRelationship = FaqEntryInFaq & {
              __typename?: \\"FAQEntriesRelationship\\";
              cursor: Scalars[\\"String\\"];
              node: FaqEntry;
              position?: Maybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntry = {
              __typename?: \\"FAQEntry\\";
              id: Scalars[\\"ID\\"];
              title: Scalars[\\"String\\"];
              body: Scalars[\\"String\\"];
              inFAQs: Array<Faq>;
              inFAQsAggregate?: Maybe<FaqEntryFaqInFaQsAggregationSelection>;
              inFAQsConnection: FaqEntryInFaQsConnection;
            };

            export type FaqEntryInFaQsArgs = {
              where?: InputMaybe<FaqWhere>;
              options?: InputMaybe<FaqOptions>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type FaqEntryInFaQsAggregateArgs = {
              where?: InputMaybe<FaqWhere>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
            };

            export type FaqEntryInFaQsConnectionArgs = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
              directed?: InputMaybe<Scalars[\\"Boolean\\"]>;
              sort?: InputMaybe<Array<FaqEntryInFaQsConnectionSort>>;
            };

            export type FaqEntryAggregateSelection = {
              __typename?: \\"FAQEntryAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              id: IdAggregateSelectionNonNullable;
              title: StringAggregateSelectionNonNullable;
              body: StringAggregateSelectionNonNullable;
            };

            export type FaqEntryEdge = {
              __typename?: \\"FAQEntryEdge\\";
              cursor: Scalars[\\"String\\"];
              node: FaqEntry;
            };

            export type FaqEntryFaqInFaQsAggregationSelection = {
              __typename?: \\"FAQEntryFAQInFAQsAggregationSelection\\";
              count: Scalars[\\"Int\\"];
              node?: Maybe<FaqEntryFaqInFaQsNodeAggregateSelection>;
              edge?: Maybe<FaqEntryFaqInFaQsEdgeAggregateSelection>;
            };

            export type FaqEntryFaqInFaQsEdgeAggregateSelection = {
              __typename?: \\"FAQEntryFAQInFAQsEdgeAggregateSelection\\";
              position: IntAggregateSelectionNullable;
            };

            export type FaqEntryFaqInFaQsNodeAggregateSelection = {
              __typename?: \\"FAQEntryFAQInFAQsNodeAggregateSelection\\";
              id: IdAggregateSelectionNonNullable;
              name: StringAggregateSelectionNonNullable;
            };

            export type FaqEntryInFaQsConnection = {
              __typename?: \\"FAQEntryInFAQsConnection\\";
              edges: Array<FaqEntryInFaQsRelationship>;
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
            };

            export type FaqEntryInFaQsRelationship = FaqEntryInFaq & {
              __typename?: \\"FAQEntryInFAQsRelationship\\";
              cursor: Scalars[\\"String\\"];
              node: Faq;
              position?: Maybe<Scalars[\\"Int\\"]>;
            };

            export type FaqfaqEntryEntriesAggregationSelection = {
              __typename?: \\"FAQFAQEntryEntriesAggregationSelection\\";
              count: Scalars[\\"Int\\"];
              node?: Maybe<FaqfaqEntryEntriesNodeAggregateSelection>;
              edge?: Maybe<FaqfaqEntryEntriesEdgeAggregateSelection>;
            };

            export type FaqfaqEntryEntriesEdgeAggregateSelection = {
              __typename?: \\"FAQFAQEntryEntriesEdgeAggregateSelection\\";
              position: IntAggregateSelectionNullable;
            };

            export type FaqfaqEntryEntriesNodeAggregateSelection = {
              __typename?: \\"FAQFAQEntryEntriesNodeAggregateSelection\\";
              id: IdAggregateSelectionNonNullable;
              title: StringAggregateSelectionNonNullable;
              body: StringAggregateSelectionNonNullable;
            };

            export type FaqsConnection = {
              __typename?: \\"FaqsConnection\\";
              totalCount: Scalars[\\"Int\\"];
              pageInfo: PageInfo;
              edges: Array<FaqEdge>;
            };

            export type IdAggregateSelectionNonNullable = {
              __typename?: \\"IDAggregateSelectionNonNullable\\";
              shortest: Scalars[\\"ID\\"];
              longest: Scalars[\\"ID\\"];
            };

            export type IntAggregateSelectionNullable = {
              __typename?: \\"IntAggregateSelectionNullable\\";
              max?: Maybe<Scalars[\\"Int\\"]>;
              min?: Maybe<Scalars[\\"Int\\"]>;
              average?: Maybe<Scalars[\\"Float\\"]>;
              sum?: Maybe<Scalars[\\"Int\\"]>;
            };

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"];
              startCursor?: Maybe<Scalars[\\"String\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"]>;
            };

            export type StringAggregateSelectionNonNullable = {
              __typename?: \\"StringAggregateSelectionNonNullable\\";
              shortest: Scalars[\\"String\\"];
              longest: Scalars[\\"String\\"];
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

            export type UpdateInfo = {
              __typename?: \\"UpdateInfo\\";
              bookmark?: Maybe<Scalars[\\"String\\"]>;
              nodesCreated: Scalars[\\"Int\\"];
              nodesDeleted: Scalars[\\"Int\\"];
              relationshipsCreated: Scalars[\\"Int\\"];
              relationshipsDeleted: Scalars[\\"Int\\"];
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
              activated: Scalars[\\"Boolean\\"];
              name: Scalars[\\"String\\"];
              entries?: InputMaybe<FaqEntriesFieldInput>;
            };

            export type FaqDeleteInput = {
              entries?: InputMaybe<Array<FaqEntriesDeleteFieldInput>>;
            };

            export type FaqDisconnectInput = {
              entries?: InputMaybe<Array<FaqEntriesDisconnectFieldInput>>;
            };

            export type FaqEntriesAggregateInput = {
              count?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              AND?: InputMaybe<Array<FaqEntriesAggregateInput>>;
              OR?: InputMaybe<Array<FaqEntriesAggregateInput>>;
              NOT?: InputMaybe<FaqEntriesAggregateInput>;
              node?: InputMaybe<FaqEntriesNodeAggregationWhereInput>;
              edge?: InputMaybe<FaqEntriesEdgeAggregationWhereInput>;
            };

            export type FaqEntriesConnectFieldInput = {
              where?: InputMaybe<FaqEntryConnectWhere>;
              connect?: InputMaybe<Array<FaqEntryConnectInput>>;
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
              /** Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0. */
              overwrite?: Scalars[\\"Boolean\\"];
            };

            export type FaqEntriesConnectionSort = {
              edge?: InputMaybe<FaqEntryInFaqSort>;
              node?: InputMaybe<FaqEntrySort>;
            };

            export type FaqEntriesConnectionWhere = {
              AND?: InputMaybe<Array<FaqEntriesConnectionWhere>>;
              OR?: InputMaybe<Array<FaqEntriesConnectionWhere>>;
              NOT?: InputMaybe<FaqEntriesConnectionWhere>;
              edge?: InputMaybe<FaqEntryInFaqWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              edge_NOT?: InputMaybe<FaqEntryInFaqWhere>;
              node?: InputMaybe<FaqEntryWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              node_NOT?: InputMaybe<FaqEntryWhere>;
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
              node: FaqEntryCreateInput;
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
            };

            export type FaqEntriesDeleteFieldInput = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              delete?: InputMaybe<FaqEntryDeleteInput>;
            };

            export type FaqEntriesDisconnectFieldInput = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              disconnect?: InputMaybe<FaqEntryDisconnectInput>;
            };

            export type FaqEntriesEdgeAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntriesEdgeAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntriesEdgeAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntriesEdgeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntriesFieldInput = {
              connectOrCreate?: InputMaybe<Array<FaqEntriesConnectOrCreateFieldInput>>;
              create?: InputMaybe<Array<FaqEntriesCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntriesConnectFieldInput>>;
            };

            export type FaqEntriesNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntriesNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntriesNodeAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntriesNodeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              id_EQUAL?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              title_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              title_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              title_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              title_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              title_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              title_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              title_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              title_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              title_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              title_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              title_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              title_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              title_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              title_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              title_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              title_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              title_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              title_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              title_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              title_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              title_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              body_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              body_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              body_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              body_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              body_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              body_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              body_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              body_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              body_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              body_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              body_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              body_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              body_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              body_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              body_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              body_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              body_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              body_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              body_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              body_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              body_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntriesUpdateConnectionInput = {
              node?: InputMaybe<FaqEntryUpdateInput>;
              edge?: InputMaybe<FaqEntryInFaqUpdateInput>;
            };

            export type FaqEntriesUpdateFieldInput = {
              where?: InputMaybe<FaqEntriesConnectionWhere>;
              connectOrCreate?: InputMaybe<Array<FaqEntriesConnectOrCreateFieldInput>>;
              create?: InputMaybe<Array<FaqEntriesCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntriesConnectFieldInput>>;
              update?: InputMaybe<FaqEntriesUpdateConnectionInput>;
              delete?: InputMaybe<Array<FaqEntriesDeleteFieldInput>>;
              disconnect?: InputMaybe<Array<FaqEntriesDisconnectFieldInput>>;
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
              title: Scalars[\\"String\\"];
              body: Scalars[\\"String\\"];
              inFAQs?: InputMaybe<FaqEntryInFaQsFieldInput>;
            };

            export type FaqEntryDeleteInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsDeleteFieldInput>>;
            };

            export type FaqEntryDisconnectInput = {
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsDisconnectFieldInput>>;
            };

            export type FaqEntryInFaqCreateInput = {
              position?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntryInFaQsAggregateInput = {
              count?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              count_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              AND?: InputMaybe<Array<FaqEntryInFaQsAggregateInput>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsAggregateInput>>;
              NOT?: InputMaybe<FaqEntryInFaQsAggregateInput>;
              node?: InputMaybe<FaqEntryInFaQsNodeAggregationWhereInput>;
              edge?: InputMaybe<FaqEntryInFaQsEdgeAggregationWhereInput>;
            };

            export type FaqEntryInFaQsConnectFieldInput = {
              where?: InputMaybe<FaqConnectWhere>;
              connect?: InputMaybe<Array<FaqConnectInput>>;
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
              /** Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0. */
              overwrite?: Scalars[\\"Boolean\\"];
            };

            export type FaqEntryInFaQsConnectionSort = {
              edge?: InputMaybe<FaqEntryInFaqSort>;
              node?: InputMaybe<FaqSort>;
            };

            export type FaqEntryInFaQsConnectionWhere = {
              AND?: InputMaybe<Array<FaqEntryInFaQsConnectionWhere>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsConnectionWhere>>;
              NOT?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              edge?: InputMaybe<FaqEntryInFaqWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              edge_NOT?: InputMaybe<FaqEntryInFaqWhere>;
              node?: InputMaybe<FaqWhere>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              node_NOT?: InputMaybe<FaqWhere>;
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
              node: FaqCreateInput;
              edge?: InputMaybe<FaqEntryInFaqCreateInput>;
            };

            export type FaqEntryInFaQsDeleteFieldInput = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              delete?: InputMaybe<FaqDeleteInput>;
            };

            export type FaqEntryInFaQsDisconnectFieldInput = {
              where?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              disconnect?: InputMaybe<FaqDisconnectInput>;
            };

            export type FaqEntryInFaQsEdgeAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntryInFaQsEdgeAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsEdgeAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntryInFaQsEdgeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              position_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              position_MIN_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_MAX_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_SUM_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntryInFaQsFieldInput = {
              connectOrCreate?: InputMaybe<Array<FaqEntryInFaQsConnectOrCreateFieldInput>>;
              create?: InputMaybe<Array<FaqEntryInFaQsCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntryInFaQsConnectFieldInput>>;
            };

            export type FaqEntryInFaQsNodeAggregationWhereInput = {
              AND?: InputMaybe<Array<FaqEntryInFaQsNodeAggregationWhereInput>>;
              OR?: InputMaybe<Array<FaqEntryInFaQsNodeAggregationWhereInput>>;
              NOT?: InputMaybe<FaqEntryInFaQsNodeAggregationWhereInput>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              id_EQUAL?: InputMaybe<Scalars[\\"ID\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Aggregation filters that are not relying on an aggregating function will be deprecated. */
              name_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Please use the explicit _LENGTH version for string aggregation. */
              name_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
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
              create?: InputMaybe<Array<FaqEntryInFaQsCreateFieldInput>>;
              connect?: InputMaybe<Array<FaqEntryInFaQsConnectFieldInput>>;
              update?: InputMaybe<FaqEntryInFaQsUpdateConnectionInput>;
              delete?: InputMaybe<Array<FaqEntryInFaQsDeleteFieldInput>>;
              disconnect?: InputMaybe<Array<FaqEntryInFaQsDisconnectFieldInput>>;
            };

            export type FaqEntryInFaqUpdateInput = {
              position?: InputMaybe<Scalars[\\"Int\\"]>;
              position_INCREMENT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_DECREMENT?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntryInFaqWhere = {
              OR?: InputMaybe<Array<FaqEntryInFaqWhere>>;
              AND?: InputMaybe<Array<FaqEntryInFaqWhere>>;
              NOT?: InputMaybe<FaqEntryInFaqWhere>;
              position?: InputMaybe<Scalars[\\"Int\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              position_NOT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"Int\\"]>>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              position_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"Int\\"]>>>;
              position_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              position_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              position_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type FaqEntryOnCreateInput = {
              title: Scalars[\\"String\\"];
              body: Scalars[\\"String\\"];
            };

            export type FaqEntryOptions = {
              /** Specify one or more FAQEntrySort objects to sort FaqEntries by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<FaqEntrySort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
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
              id?: InputMaybe<Scalars[\\"ID\\"]>;
            };

            export type FaqEntryUpdateInput = {
              title?: InputMaybe<Scalars[\\"String\\"]>;
              body?: InputMaybe<Scalars[\\"String\\"]>;
              inFAQs?: InputMaybe<Array<FaqEntryInFaQsUpdateFieldInput>>;
            };

            export type FaqEntryWhere = {
              OR?: InputMaybe<Array<FaqEntryWhere>>;
              AND?: InputMaybe<Array<FaqEntryWhere>>;
              NOT?: InputMaybe<FaqEntryWhere>;
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
              title?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              title_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              title_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              title_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              title_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              title_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              body?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              body_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              body_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              body_NOT_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              body_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              body_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              body_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              body_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              body_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              body_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Use \`inFAQs_SOME\` instead. */
              inFAQs?: InputMaybe<FaqWhere>;
              /** @deprecated Use \`inFAQs_NONE\` instead. */
              inFAQs_NOT?: InputMaybe<FaqWhere>;
              inFAQsAggregate?: InputMaybe<FaqEntryInFaQsAggregateInput>;
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
              /** @deprecated Use \`inFAQsConnection_NONE\` instead. */
              inFAQsConnection_NOT?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where all of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_ALL?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where none of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_NONE?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where one of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_SINGLE?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
              /** Return FAQEntries where some of the related FAQEntryInFAQsConnections match this filter */
              inFAQsConnection_SOME?: InputMaybe<FaqEntryInFaQsConnectionWhere>;
            };

            export type FaqOnCreateInput = {
              activated: Scalars[\\"Boolean\\"];
              name: Scalars[\\"String\\"];
            };

            export type FaqOptions = {
              /** Specify one or more FAQSort objects to sort Faqs by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<FaqSort>>;
              limit?: InputMaybe<Scalars[\\"Int\\"]>;
              offset?: InputMaybe<Scalars[\\"Int\\"]>;
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
              id?: InputMaybe<Scalars[\\"ID\\"]>;
            };

            export type FaqUpdateInput = {
              activated?: InputMaybe<Scalars[\\"Boolean\\"]>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              entries?: InputMaybe<Array<FaqEntriesUpdateFieldInput>>;
            };

            export type FaqWhere = {
              OR?: InputMaybe<Array<FaqWhere>>;
              AND?: InputMaybe<Array<FaqWhere>>;
              NOT?: InputMaybe<FaqWhere>;
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
              activated?: InputMaybe<Scalars[\\"Boolean\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              activated_NOT?: InputMaybe<Scalars[\\"Boolean\\"]>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_IN?: InputMaybe<Array<Scalars[\\"String\\"]>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Negation filters will be deprecated, use the NOT operator to achieve the same behavior */
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              /** @deprecated Use \`entries_SOME\` instead. */
              entries?: InputMaybe<FaqEntryWhere>;
              /** @deprecated Use \`entries_NONE\` instead. */
              entries_NOT?: InputMaybe<FaqEntryWhere>;
              entriesAggregate?: InputMaybe<FaqEntriesAggregateInput>;
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
              /** @deprecated Use \`entriesConnection_NONE\` instead. */
              entriesConnection_NOT?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where all of the related FAQEntriesConnections match this filter */
              entriesConnection_ALL?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where none of the related FAQEntriesConnections match this filter */
              entriesConnection_NONE?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where one of the related FAQEntriesConnections match this filter */
              entriesConnection_SINGLE?: InputMaybe<FaqEntriesConnectionWhere>;
              /** Return FAQS where some of the related FAQEntriesConnections match this filter */
              entriesConnection_SOME?: InputMaybe<FaqEntriesConnectionWhere>;
            };

            export interface IdAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface StringAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface FAQAggregateSelectionInput {
              count?: boolean;
              id?: IdAggregateInputNonNullable;
              name?: StringAggregateInputNonNullable;
            }

            export declare class FAQModel {
              public find(args?: {
                where?: FaqWhere;

                options?: FaqOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<FAQ[]>;
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

                aggregate: FaqAggregateSelectionInput;
                context?: any;
                rootValue?: any;
              }): Promise<FaqAggregateSelection>;
            }

            export interface IdAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface StringAggregateInputNonNullable {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface FAQEntryAggregateSelectionInput {
              count?: boolean;
              id?: IdAggregateInputNonNullable;
              title?: StringAggregateInputNonNullable;
              body?: StringAggregateInputNonNullable;
            }

            export declare class FAQEntryModel {
              public find(args?: {
                where?: FaqEntryWhere;

                options?: FaqEntryOptions;
                selectionSet?: string | DocumentNode | SelectionSetNode;
                args?: any;
                context?: any;
                rootValue?: any;
              }): Promise<FAQEntry[]>;
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

                aggregate: FaqEntryAggregateSelectionInput;
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
