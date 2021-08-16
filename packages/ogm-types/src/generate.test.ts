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
import generate from "./generate";
import { OGM } from "@neo4j/graphql-ogm";
import * as fs from "fs";
import * as path from "path";

// Replace all \n with a space & replace all spaces > 1 with a single space
function trimmer(str: string): string {
    return str.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
}

describe("generate", () => {
    let filesToDelete: string[] = [];

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

        expect(trimmer(generated)).toEqual(
            trimmer(`
                import { SelectionSetNode, DocumentNode } from "graphql";

                export type Maybe<T> = T | null;

                export type Exact<T extends { [key: string]: unknown }> = {
                  [K in keyof T]: T[K];
                };

                export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
                  { [SubKey in K]?: Maybe<T[SubKey]> };

                export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
                  { [SubKey in K]: Maybe<T[SubKey]> };

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
                  __typename?: "Query";
                  users: Array<User>;
                  usersCount: Scalars["Int"];
                };
            
                export type QueryUsersArgs = {
                  where?: Maybe<UserWhere>;
                  options?: Maybe<UserOptions>;
                };
            
                export type QueryUsersCountArgs = {
                  where?: Maybe<UserWhere>;
                };
            
                export type Mutation = {
                  __typename?: "Mutation";
                  createUsers: CreateUsersMutationResponse;
                  deleteUsers: DeleteInfo;
                  updateUsers: UpdateUsersMutationResponse;
                };
            
                export type MutationCreateUsersArgs = {
                  input: Array<UserCreateInput>;
                };
            
                export type MutationDeleteUsersArgs = {
                  where?: Maybe<UserWhere>;
                };
            
                export type MutationUpdateUsersArgs = {
                  where?: Maybe<UserWhere>;
                  update?: Maybe<UserUpdateInput>;
                };
            
                export enum SortDirection {
                  /** Sort by field values in ascending order. */
                  Asc = "ASC",
                  /** Sort by field values in descending order. */
                  Desc = "DESC",
                }
            
                export type CreateUsersMutationResponse = {
                  __typename?: "CreateUsersMutationResponse";
                  users: Array<User>;
                };
            
                export type DeleteInfo = {
                  __typename?: "DeleteInfo";
                  nodesDeleted: Scalars["Int"];
                  relationshipsDeleted: Scalars["Int"];
                };
            
                export type UpdateUsersMutationResponse = {
                  __typename?: "UpdateUsersMutationResponse";
                  users: Array<User>;
                };
            
                export type User = {
                  __typename?: "User";
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type UserCreateInput = {
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type UserOptions = {
                  /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
                  sort?: Maybe<Array<Maybe<UserSort>>>;
                  limit?: Maybe<Scalars["Int"]>;
                  offset?: Maybe<Scalars["Int"]>;
                };
            
                /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
                export type UserSort = {
                  name?: Maybe<SortDirection>;
                };
            
                export type UserUpdateInput = {
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type UserWhere = {
                  OR?: Maybe<Array<UserWhere>>;
                  AND?: Maybe<Array<UserWhere>>;
                  name?: Maybe<Scalars["String"]>;
                  name_NOT?: Maybe<Scalars["String"]>;
                  name_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  name_NOT_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  name_CONTAINS?: Maybe<Scalars["String"]>;
                  name_NOT_CONTAINS?: Maybe<Scalars["String"]>;
                  name_STARTS_WITH?: Maybe<Scalars["String"]>;
                  name_NOT_STARTS_WITH?: Maybe<Scalars["String"]>;
                  name_ENDS_WITH?: Maybe<Scalars["String"]>;
                  name_NOT_ENDS_WITH?: Maybe<Scalars["String"]>;
                };
            
                export declare class UserModel {
                  public find(args: {
                    where?: UserWhere;
                    options?: UserOptions;
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                  }): Promise<User[]>;
              
                  public count(args: { where?: UserWhere }): Promise<number>;
              
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
                }
            `)
        );
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

        expect(trimmer(fileContent)).toEqual(
            trimmer(`
                import { SelectionSetNode, DocumentNode } from "graphql";

                export type Maybe<T> = T | null;

                export type Exact<T extends { [key: string]: unknown }> = {
                  [K in keyof T]: T[K];
                };

                export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
                  { [SubKey in K]?: Maybe<T[SubKey]> };

                export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
                  { [SubKey in K]: Maybe<T[SubKey]> };

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
                  __typename?: "Query";
                  users: Array<User>;
                  usersCount: Scalars["Int"];
                };
            
                export type QueryUsersArgs = {
                  where?: Maybe<UserWhere>;
                  options?: Maybe<UserOptions>;
                };
            
                export type QueryUsersCountArgs = {
                  where?: Maybe<UserWhere>;
                };
            
                export type Mutation = {
                  __typename?: "Mutation";
                  createUsers: CreateUsersMutationResponse;
                  deleteUsers: DeleteInfo;
                  updateUsers: UpdateUsersMutationResponse;
                };
            
                export type MutationCreateUsersArgs = {
                  input: Array<UserCreateInput>;
                };
            
                export type MutationDeleteUsersArgs = {
                  where?: Maybe<UserWhere>;
                };
            
                export type MutationUpdateUsersArgs = {
                  where?: Maybe<UserWhere>;
                  update?: Maybe<UserUpdateInput>;
                };
            
                export enum SortDirection {
                  /** Sort by field values in ascending order. */
                  Asc = "ASC",
                  /** Sort by field values in descending order. */
                  Desc = "DESC",
                }
            
                export type CreateUsersMutationResponse = {
                  __typename?: "CreateUsersMutationResponse";
                  users: Array<User>;
                };
            
                export type DeleteInfo = {
                  __typename?: "DeleteInfo";
                  nodesDeleted: Scalars["Int"];
                  relationshipsDeleted: Scalars["Int"];
                };
            
                export type UpdateUsersMutationResponse = {
                  __typename?: "UpdateUsersMutationResponse";
                  users: Array<User>;
                };
            
                export type User = {
                  __typename?: "User";
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type UserCreateInput = {
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type UserOptions = {
                  /** Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array. */
                  sort?: Maybe<Array<Maybe<UserSort>>>;
                  limit?: Maybe<Scalars["Int"]>;
                  offset?: Maybe<Scalars["Int"]>;
                };
            
                /** Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object. */
                export type UserSort = {
                  name?: Maybe<SortDirection>;
                };
            
                export type UserUpdateInput = {
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type UserWhere = {
                  OR?: Maybe<Array<UserWhere>>;
                  AND?: Maybe<Array<UserWhere>>;
                  name?: Maybe<Scalars["String"]>;
                  name_NOT?: Maybe<Scalars["String"]>;
                  name_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  name_NOT_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  name_CONTAINS?: Maybe<Scalars["String"]>;
                  name_NOT_CONTAINS?: Maybe<Scalars["String"]>;
                  name_STARTS_WITH?: Maybe<Scalars["String"]>;
                  name_NOT_STARTS_WITH?: Maybe<Scalars["String"]>;
                  name_ENDS_WITH?: Maybe<Scalars["String"]>;
                  name_NOT_ENDS_WITH?: Maybe<Scalars["String"]>;
                };
            
                export declare class UserModel {
                  public find(args: {
                    where?: UserWhere;
                    options?: UserOptions;
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                  }): Promise<User[]>;
              
                  public count(args: { where?: UserWhere }): Promise<number>;
              
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
                }
            `)
        );
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

        expect(trimmer(generated)).toEqual(
            trimmer(`
                import { SelectionSetNode, DocumentNode } from "graphql";

                export type Maybe<T> = T | null;

                export type Exact<T extends { [key: string]: unknown }> = {
                  [K in keyof T]: T[K];
                };

                export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
                  { [SubKey in K]?: Maybe<T[SubKey]> };

                export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
                  { [SubKey in K]: Maybe<T[SubKey]> };
                  
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
                  __typename?: "Query";
                  movies: Array<Movie>;
                  moviesCount: Scalars["Int"];
                  people: Array<Person>;
                  peopleCount: Scalars["Int"];
                };
            
                export type QueryMoviesArgs = {
                  where?: Maybe<MovieWhere>;
                  options?: Maybe<MovieOptions>;
                };
            
                export type QueryMoviesCountArgs = {
                  where?: Maybe<MovieWhere>;
                };
            
                export type QueryPeopleArgs = {
                  where?: Maybe<PersonWhere>;
                  options?: Maybe<PersonOptions>;
                };
            
                export type QueryPeopleCountArgs = {
                  where?: Maybe<PersonWhere>;
                };
            
                export type Mutation = {
                  __typename?: "Mutation";
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
                  where?: Maybe<MovieWhere>;
                  delete?: Maybe<MovieDeleteInput>;
                };
            
                export type MutationUpdateMoviesArgs = {
                  where?: Maybe<MovieWhere>;
                  update?: Maybe<MovieUpdateInput>;
                  connect?: Maybe<MovieConnectInput>;
                  disconnect?: Maybe<MovieDisconnectInput>;
                  create?: Maybe<MovieRelationInput>;
                  delete?: Maybe<MovieDeleteInput>;
                };
            
                export type MutationCreatePeopleArgs = {
                  input: Array<PersonCreateInput>;
                };
            
                export type MutationDeletePeopleArgs = {
                  where?: Maybe<PersonWhere>;
                };
            
                export type MutationUpdatePeopleArgs = {
                  where?: Maybe<PersonWhere>;
                  update?: Maybe<PersonUpdateInput>;
                };
            
                export enum SortDirection {
                  /** Sort by field values in ascending order. */
                  Asc = "ASC",
                  /** Sort by field values in descending order. */
                  Desc = "DESC",
                }
            
                export type ActedIn = {
                  screenTime: Scalars["Int"];
                };
            
                export type CreateMoviesMutationResponse = {
                  __typename?: "CreateMoviesMutationResponse";
                  movies: Array<Movie>;
                };
            
                export type CreatePeopleMutationResponse = {
                  __typename?: "CreatePeopleMutationResponse";
                  people: Array<Person>;
                };
            
                export type DeleteInfo = {
                  __typename?: "DeleteInfo";
                  nodesDeleted: Scalars["Int"];
                  relationshipsDeleted: Scalars["Int"];
                };
            
                export type Movie = {
                  __typename?: "Movie";
                  title: Scalars["String"];
                  actors?: Maybe<Array<Maybe<Person>>>;
                  actorsConnection: MovieActorsConnection;
                };
            
                export type MovieActorsArgs = {
                  where?: Maybe<PersonWhere>;
                  options?: Maybe<PersonOptions>;
                };
            
                export type MovieActorsConnectionArgs = {
                  where?: Maybe<MovieActorsConnectionWhere>;
                  first?: Maybe<Scalars["Int"]>;
                  after?: Maybe<Scalars["String"]>;
                  sort?: Maybe<Array<MovieActorsConnectionSort>>;
                };
            
                export type MovieActorsConnection = {
                  __typename?: "MovieActorsConnection";
                  edges: Array<MovieActorsRelationship>;
                  totalCount: Scalars["Int"];
                  pageInfo: PageInfo;
                };
            
                export type MovieActorsRelationship = ActedIn & {
                  __typename?: "MovieActorsRelationship";
                  cursor: Scalars["String"];
                  node: Person;
                  screenTime: Scalars["Int"];
                };
            
                /** Pagination information (Relay) */
                export type PageInfo = {
                  __typename?: "PageInfo";
                  hasNextPage: Scalars["Boolean"];
                  hasPreviousPage: Scalars["Boolean"];
                  startCursor?: Maybe<Scalars["String"]>;
                  endCursor?: Maybe<Scalars["String"]>;
                };
            
                export type Person = {
                  __typename?: "Person";
                  name: Scalars["String"];
                };
            
                export type UpdateMoviesMutationResponse = {
                  __typename?: "UpdateMoviesMutationResponse";
                  movies: Array<Movie>;
                };
            
                export type UpdatePeopleMutationResponse = {
                  __typename?: "UpdatePeopleMutationResponse";
                  people: Array<Person>;
                };
            
                export type ActedInCreateInput = {
                  screenTime: Scalars["Int"];
                };
            
                export type ActedInSort = {
                  screenTime?: Maybe<SortDirection>;
                };
            
                export type ActedInUpdateInput = {
                  screenTime?: Maybe<Scalars["Int"]>;
                };
            
                export type ActedInWhere = {
                  OR?: Maybe<Array<ActedInWhere>>;
                  AND?: Maybe<Array<ActedInWhere>>;
                  screenTime?: Maybe<Scalars["Int"]>;
                  screenTime_NOT?: Maybe<Scalars["Int"]>;
                  screenTime_IN?: Maybe<Array<Maybe<Scalars["Int"]>>>;
                  screenTime_NOT_IN?: Maybe<Array<Maybe<Scalars["Int"]>>>;
                  screenTime_LT?: Maybe<Scalars["Int"]>;
                  screenTime_LTE?: Maybe<Scalars["Int"]>;
                  screenTime_GT?: Maybe<Scalars["Int"]>;
                  screenTime_GTE?: Maybe<Scalars["Int"]>;
                };
            
                export type MovieActorsConnectFieldInput = {
                  where?: Maybe<PersonConnectWhere>;
                  edge: ActedInCreateInput;
                };
            
                export type MovieActorsConnectionSort = {
                  node?: Maybe<PersonSort>;
                  edge?: Maybe<ActedInSort>;
                };
            
                export type MovieActorsConnectionWhere = {
                  AND?: Maybe<Array<MovieActorsConnectionWhere>>;
                  OR?: Maybe<Array<MovieActorsConnectionWhere>>;
                  edge?: Maybe<ActedInWhere>;
                  edge_NOT?: Maybe<ActedInWhere>;
                  node?: Maybe<PersonWhere>;
                  node_NOT?: Maybe<PersonWhere>;
                };
            
                export type MovieActorsCreateFieldInput = {
                  node: PersonCreateInput;
                  edge: ActedInCreateInput;
                };
            
                export type MovieActorsDeleteFieldInput = {
                  where?: Maybe<MovieActorsConnectionWhere>;
                };
            
                export type MovieActorsDisconnectFieldInput = {
                  where?: Maybe<MovieActorsConnectionWhere>;
                };
            
                export type MovieActorsFieldInput = {
                  create?: Maybe<Array<MovieActorsCreateFieldInput>>;
                  connect?: Maybe<Array<MovieActorsConnectFieldInput>>;
                };
            
                export type MovieActorsUpdateConnectionInput = {
                  node?: Maybe<PersonUpdateInput>;
                  edge?: Maybe<ActedInUpdateInput>;
                };
            
                export type MovieActorsUpdateFieldInput = {
                  where?: Maybe<MovieActorsConnectionWhere>;
                  update?: Maybe<MovieActorsUpdateConnectionInput>;
                  connect?: Maybe<Array<MovieActorsConnectFieldInput>>;
                  disconnect?: Maybe<Array<MovieActorsDisconnectFieldInput>>;
                  create?: Maybe<Array<MovieActorsCreateFieldInput>>;
                  delete?: Maybe<Array<MovieActorsDeleteFieldInput>>;
                };
            
                export type MovieConnectInput = {
                  actors?: Maybe<Array<MovieActorsConnectFieldInput>>;
                };
            
                export type MovieCreateInput = {
                  title: Scalars["String"];
                  actors?: Maybe<MovieActorsFieldInput>;
                };
            
                export type MovieDeleteInput = {
                  actors?: Maybe<Array<MovieActorsDeleteFieldInput>>;
                };
            
                export type MovieDisconnectInput = {
                  actors?: Maybe<Array<MovieActorsDisconnectFieldInput>>;
                };
            
                export type MovieOptions = {
                  /** Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array. */
                  sort?: Maybe<Array<Maybe<MovieSort>>>;
                  limit?: Maybe<Scalars["Int"]>;
                  offset?: Maybe<Scalars["Int"]>;
                };
            
                export type MovieRelationInput = {
                  actors?: Maybe<Array<MovieActorsCreateFieldInput>>;
                };
            
                /** Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object. */
                export type MovieSort = {
                  title?: Maybe<SortDirection>;
                };
            
                export type MovieUpdateInput = {
                  title?: Maybe<Scalars["String"]>;
                  actors?: Maybe<Array<MovieActorsUpdateFieldInput>>;
                };
            
                export type MovieWhere = {
                  OR?: Maybe<Array<MovieWhere>>;
                  AND?: Maybe<Array<MovieWhere>>;
                  title?: Maybe<Scalars["String"]>;
                  title_NOT?: Maybe<Scalars["String"]>;
                  title_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  title_NOT_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  title_CONTAINS?: Maybe<Scalars["String"]>;
                  title_NOT_CONTAINS?: Maybe<Scalars["String"]>;
                  title_STARTS_WITH?: Maybe<Scalars["String"]>;
                  title_NOT_STARTS_WITH?: Maybe<Scalars["String"]>;
                  title_ENDS_WITH?: Maybe<Scalars["String"]>;
                  title_NOT_ENDS_WITH?: Maybe<Scalars["String"]>;
                  actors?: Maybe<PersonWhere>;
                  actors_NOT?: Maybe<PersonWhere>;
                  actorsConnection?: Maybe<MovieActorsConnectionWhere>;
                  actorsConnection_NOT?: Maybe<MovieActorsConnectionWhere>;
                };
            
                export type PersonConnectWhere = {
                  node: PersonWhere;
                };
            
                export type PersonCreateInput = {
                  name: Scalars["String"];
                };
            
                export type PersonOptions = {
                  /** Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array. */
                  sort?: Maybe<Array<Maybe<PersonSort>>>;
                  limit?: Maybe<Scalars["Int"]>;
                  offset?: Maybe<Scalars["Int"]>;
                };
            
                /** Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object. */
                export type PersonSort = {
                  name?: Maybe<SortDirection>;
                };
            
                export type PersonUpdateInput = {
                  name?: Maybe<Scalars["String"]>;
                };
            
                export type PersonWhere = {
                  OR?: Maybe<Array<PersonWhere>>;
                  AND?: Maybe<Array<PersonWhere>>;
                  name?: Maybe<Scalars["String"]>;
                  name_NOT?: Maybe<Scalars["String"]>;
                  name_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  name_NOT_IN?: Maybe<Array<Maybe<Scalars["String"]>>>;
                  name_CONTAINS?: Maybe<Scalars["String"]>;
                  name_NOT_CONTAINS?: Maybe<Scalars["String"]>;
                  name_STARTS_WITH?: Maybe<Scalars["String"]>;
                  name_NOT_STARTS_WITH?: Maybe<Scalars["String"]>;
                  name_ENDS_WITH?: Maybe<Scalars["String"]>;
                  name_NOT_ENDS_WITH?: Maybe<Scalars["String"]>;
                };
            
                export declare class MovieModel {
                  public find(args: {
                    where?: MovieWhere;
                    options?: MovieOptions;
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                  }): Promise<Movie[]>;
              
                  public count(args: { where?: MovieWhere }): Promise<number>;
              
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
                }
            
                export declare class PersonModel {
                  public find(args: {
                    where?: PersonWhere;
                    options?: PersonOptions;
                    selectionSet?: string | DocumentNode | SelectionSetNode;
                    args?: any;
                    context?: any;
                    rootValue?: any;
                  }): Promise<Person[]>;
              
                  public count(args: { where?: PersonWhere }): Promise<number>;
              
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
                }
            `)
        );
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
