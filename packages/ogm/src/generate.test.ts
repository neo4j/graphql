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
            "import { SelectionSetNode, DocumentNode } from \\"graphql\\";
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
              usersCount: Scalars[\\"Int\\"];
              usersAggregate: UserAggregateSelection;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              options?: InputMaybe<UserOptions>;
            };

            export type QueryUsersCountArgs = {
              where?: InputMaybe<UserWhere>;
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

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
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
              name: StringAggregateSelection;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserOptions = {
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<InputMaybe<UserSort>>>;
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
              name?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInput {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateInput {
              count?: boolean;
              name?: StringAggregateInput;
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
              public count(args?: { where?: UserWhere }): Promise<number>;
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
                rootValue: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: UserWhere;

                aggregate: UserAggregateInput;
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
            "import { SelectionSetNode, DocumentNode } from \\"graphql\\";
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
              usersCount: Scalars[\\"Int\\"];
              usersAggregate: UserAggregateSelection;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              options?: InputMaybe<UserOptions>;
              fulltext?: InputMaybe<UserFulltext>;
            };

            export type QueryUsersCountArgs = {
              where?: InputMaybe<UserWhere>;
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

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
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
              name: StringAggregateSelection;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserFulltext = {
              UserName?: InputMaybe<UserUserNameFulltext>;
            };

            export type UserOptions = {
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<InputMaybe<UserSort>>>;
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
              score_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type UserWhere = {
              OR?: InputMaybe<Array<UserWhere>>;
              AND?: InputMaybe<Array<UserWhere>>;
              name?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInput {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateInput {
              count?: boolean;
              name?: StringAggregateInput;
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
              public count(args?: {
                where?: UserWhere;
                fulltext?: UserFulltext;
              }): Promise<number>;
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
                rootValue: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: UserWhere;
                fulltext?: UserFulltext;
                aggregate: UserAggregateInput;
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
            "import { SelectionSetNode, DocumentNode } from \\"graphql\\";
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
              usersCount: Scalars[\\"Int\\"];
              usersAggregate: UserAggregateSelection;
            };

            export type QueryUsersArgs = {
              where?: InputMaybe<UserWhere>;
              options?: InputMaybe<UserOptions>;
            };

            export type QueryUsersCountArgs = {
              where?: InputMaybe<UserWhere>;
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

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
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
              name: StringAggregateSelection;
            };

            export type UserCreateInput = {
              name?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export type UserOptions = {
              /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<InputMaybe<UserSort>>>;
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
              name?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInput {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface UserAggregateInput {
              count?: boolean;
              name?: StringAggregateInput;
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
              public count(args?: { where?: UserWhere }): Promise<number>;
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
                rootValue: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: UserWhere;

                aggregate: UserAggregateInput;
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
                actors: [Person] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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
            "import { SelectionSetNode, DocumentNode } from \\"graphql\\";
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
              moviesCount: Scalars[\\"Int\\"];
              moviesAggregate: MovieAggregateSelection;
              people: Array<Person>;
              peopleCount: Scalars[\\"Int\\"];
              peopleAggregate: PersonAggregateSelection;
            };

            export type QueryMoviesArgs = {
              where?: InputMaybe<MovieWhere>;
              options?: InputMaybe<MovieOptions>;
            };

            export type QueryMoviesCountArgs = {
              where?: InputMaybe<MovieWhere>;
            };

            export type QueryMoviesAggregateArgs = {
              where?: InputMaybe<MovieWhere>;
            };

            export type QueryPeopleArgs = {
              where?: InputMaybe<PersonWhere>;
              options?: InputMaybe<PersonOptions>;
            };

            export type QueryPeopleCountArgs = {
              where?: InputMaybe<PersonWhere>;
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

            export type IntAggregateSelection = {
              __typename?: \\"IntAggregateSelection\\";
              max?: Maybe<Scalars[\\"Int\\"]>;
              min?: Maybe<Scalars[\\"Int\\"]>;
              average?: Maybe<Scalars[\\"Float\\"]>;
              sum?: Maybe<Scalars[\\"Int\\"]>;
            };

            export type Movie = {
              __typename?: \\"Movie\\";
              title: Scalars[\\"String\\"];
              actors?: Maybe<Array<Maybe<Person>>>;
              actorsAggregate?: Maybe<MoviePersonActorsAggregationSelection>;
              actorsConnection: MovieActorsConnection;
            };

            export type MovieActorsArgs = {
              where?: InputMaybe<PersonWhere>;
              options?: InputMaybe<PersonOptions>;
            };

            export type MovieActorsAggregateArgs = {
              where?: InputMaybe<PersonWhere>;
            };

            export type MovieActorsConnectionArgs = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
              sort?: InputMaybe<Array<MovieActorsConnectionSort>>;
              first?: InputMaybe<Scalars[\\"Int\\"]>;
              after?: InputMaybe<Scalars[\\"String\\"]>;
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
              title: StringAggregateSelection;
            };

            export type MoviePersonActorsAggregationSelection = {
              __typename?: \\"MoviePersonActorsAggregationSelection\\";
              count: Scalars[\\"Int\\"];
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

            /** Pagination information (Relay) */
            export type PageInfo = {
              __typename?: \\"PageInfo\\";
              hasNextPage: Scalars[\\"Boolean\\"];
              hasPreviousPage: Scalars[\\"Boolean\\"];
              startCursor?: Maybe<Scalars[\\"String\\"]>;
              endCursor?: Maybe<Scalars[\\"String\\"]>;
            };

            export type Person = {
              __typename?: \\"Person\\";
              name: Scalars[\\"String\\"];
            };

            export type PersonAggregateSelection = {
              __typename?: \\"PersonAggregateSelection\\";
              count: Scalars[\\"Int\\"];
              name: StringAggregateSelection;
            };

            export type StringAggregateSelection = {
              __typename?: \\"StringAggregateSelection\\";
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
            };

            export type ActedInWhere = {
              OR?: InputMaybe<Array<ActedInWhere>>;
              AND?: InputMaybe<Array<ActedInWhere>>;
              screenTime?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_NOT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"Int\\"]>>>;
              screenTime_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"Int\\"]>>>;
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
              node?: InputMaybe<MovieActorsNodeAggregationWhereInput>;
              edge?: InputMaybe<MovieActorsEdgeAggregationWhereInput>;
            };

            export type MovieActorsConnectFieldInput = {
              where?: InputMaybe<PersonConnectWhere>;
              edge: ActedInCreateInput;
            };

            export type MovieActorsConnectionSort = {
              edge?: InputMaybe<ActedInSort>;
              node?: InputMaybe<PersonSort>;
            };

            export type MovieActorsConnectionWhere = {
              AND?: InputMaybe<Array<MovieActorsConnectionWhere>>;
              OR?: InputMaybe<Array<MovieActorsConnectionWhere>>;
              edge?: InputMaybe<ActedInWhere>;
              edge_NOT?: InputMaybe<ActedInWhere>;
              node?: InputMaybe<PersonWhere>;
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
              screenTime_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              screenTime_MIN_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_MAX_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              screenTime_SUM_LT?: InputMaybe<Scalars[\\"Int\\"]>;
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
              name_EQUAL?: InputMaybe<Scalars[\\"String\\"]>;
              name_AVERAGE_EQUAL?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_EQUAL?: InputMaybe<Scalars[\\"Int\\"]>;
              name_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_GT?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_GT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_GTE?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_GTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LT?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LT?: InputMaybe<Scalars[\\"Int\\"]>;
              name_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_AVERAGE_LTE?: InputMaybe<Scalars[\\"Float\\"]>;
              name_LONGEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
              name_SHORTEST_LTE?: InputMaybe<Scalars[\\"Int\\"]>;
            };

            export type MovieActorsUpdateConnectionInput = {
              node?: InputMaybe<PersonUpdateInput>;
              edge?: InputMaybe<ActedInUpdateInput>;
            };

            export type MovieActorsUpdateFieldInput = {
              where?: InputMaybe<MovieActorsConnectionWhere>;
              update?: InputMaybe<MovieActorsUpdateConnectionInput>;
              connect?: InputMaybe<Array<MovieActorsConnectFieldInput>>;
              disconnect?: InputMaybe<Array<MovieActorsDisconnectFieldInput>>;
              create?: InputMaybe<Array<MovieActorsCreateFieldInput>>;
              delete?: InputMaybe<Array<MovieActorsDeleteFieldInput>>;
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
              sort?: InputMaybe<Array<InputMaybe<MovieSort>>>;
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
              title?: InputMaybe<Scalars[\\"String\\"]>;
              title_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              title_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              title_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              title_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              title_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              title_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              title_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              title_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              title_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              actors?: InputMaybe<PersonWhere>;
              actors_NOT?: InputMaybe<PersonWhere>;
              actorsAggregate?: InputMaybe<MovieActorsAggregateInput>;
              actorsConnection?: InputMaybe<MovieActorsConnectionWhere>;
              actorsConnection_NOT?: InputMaybe<MovieActorsConnectionWhere>;
            };

            export type PersonConnectWhere = {
              node: PersonWhere;
            };

            export type PersonCreateInput = {
              name: Scalars[\\"String\\"];
            };

            export type PersonOptions = {
              /** Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array. */
              sort?: InputMaybe<Array<InputMaybe<PersonSort>>>;
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
              name?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT?: InputMaybe<Scalars[\\"String\\"]>;
              name_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_NOT_IN?: InputMaybe<Array<InputMaybe<Scalars[\\"String\\"]>>>;
              name_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_CONTAINS?: InputMaybe<Scalars[\\"String\\"]>;
              name_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_STARTS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
              name_NOT_ENDS_WITH?: InputMaybe<Scalars[\\"String\\"]>;
            };

            export interface StringAggregateInput {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface MovieAggregateInput {
              count?: boolean;
              title?: StringAggregateInput;
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
              public count(args?: { where?: MovieWhere }): Promise<number>;
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
                rootValue: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: MovieWhere;

                aggregate: MovieAggregateInput;
                context?: any;
                rootValue?: any;
              }): Promise<MovieAggregateSelection>;
            }

            export interface StringAggregateInput {
              shortest?: boolean;
              longest?: boolean;
            }
            export interface PersonAggregateInput {
              count?: boolean;
              name?: StringAggregateInput;
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
              public count(args?: { where?: PersonWhere }): Promise<number>;
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
                rootValue: any;
              }): Promise<{ nodesDeleted: number; relationshipsDeleted: number }>;
              public aggregate(args: {
                where?: PersonWhere;

                aggregate: PersonAggregateInput;
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
});
