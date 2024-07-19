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
import { Neo4jGraphQL } from "../../../../src";

describe("Apollo Federation", () => {
    test("@shareable", async () => {
        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

            type User @node @shareable {
                name: String!
                posts: [Post!]! @relationship(type: "HAS_AUTHOR", direction: IN)
            }

            type Post @node {
                content: String!
                author: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver: jest.fn() as any });

        const printedSchema = printSchemaWithDirectives(
            lexicographicSortSchema(await neoSchema.getAuraSubgraphSchema())
        );
        // const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSubgraphSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema @link(url: \\"https://specs.apollo.dev/link/v1.0\\") @link(url: \\"https://specs.apollo.dev/federation/v2.0\\", import: [\\"@shareable\\"]) {
              query: Query
            }

            directive @federation__extends on INTERFACE | OBJECT

            directive @federation__external(reason: String) on FIELD_DEFINITION | OBJECT

            directive @federation__inaccessible on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @federation__key(fields: federation__FieldSet!, resolvable: Boolean = true) repeatable on INTERFACE | OBJECT

            directive @federation__override(from: String!) on FIELD_DEFINITION

            directive @federation__provides(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__requires(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__tag(name: String!) repeatable on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @link(as: String, for: link__Purpose, import: [link__Import], url: String) repeatable on SCHEMA

            directive @shareable on FIELD_DEFINITION | OBJECT

            type PageInfo @shareable {
              endCursor: String
              hasNextPage: Boolean
              hasPreviousPage: Boolean
              startCursor: String
            }

            type Post {
              author(where: PostAuthorOperationWhere): PostAuthorOperation
              content: String!
            }

            type PostAuthorConnection {
              edges: [PostAuthorEdge]
              pageInfo: PageInfo
            }

            input PostAuthorConnectionSort {
              edges: PostAuthorEdgeSort
            }

            type PostAuthorEdge {
              cursor: String
              node: User
            }

            input PostAuthorEdgeListWhere {
              AND: [PostAuthorEdgeListWhere!]
              NOT: PostAuthorEdgeListWhere
              OR: [PostAuthorEdgeListWhere!]
              all: PostAuthorEdgeWhere
              none: PostAuthorEdgeWhere
              single: PostAuthorEdgeWhere
              some: PostAuthorEdgeWhere
            }

            input PostAuthorEdgeSort {
              node: UserSort
            }

            input PostAuthorEdgeWhere {
              AND: [PostAuthorEdgeWhere!]
              NOT: PostAuthorEdgeWhere
              OR: [PostAuthorEdgeWhere!]
              node: UserWhere
            }

            input PostAuthorNestedOperationWhere {
              AND: [PostAuthorNestedOperationWhere!]
              NOT: PostAuthorNestedOperationWhere
              OR: [PostAuthorNestedOperationWhere!]
              edges: PostAuthorEdgeListWhere
            }

            type PostAuthorOperation {
              connection(after: String, first: Int, sort: [PostAuthorConnectionSort!]): PostAuthorConnection
            }

            input PostAuthorOperationWhere {
              AND: [PostAuthorOperationWhere!]
              NOT: PostAuthorOperationWhere
              OR: [PostAuthorOperationWhere!]
              edges: PostAuthorEdgeWhere
            }

            type PostConnection {
              edges: [PostEdge]
              pageInfo: PageInfo
            }

            input PostConnectionSort {
              node: PostSort
            }

            type PostEdge {
              cursor: String
              node: Post
            }

            type PostOperation {
              connection(after: String, first: Int, sort: [PostConnectionSort!]): PostConnection
            }

            input PostOperationWhere {
              AND: [PostOperationWhere!]
              NOT: PostOperationWhere
              OR: [PostOperationWhere!]
              node: PostWhere
            }

            input PostSort {
              content: SortDirection
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: PostAuthorNestedOperationWhere
              content: StringWhere
            }

            type Query {
              _service: _Service!
              posts(where: PostOperationWhere): PostOperation
              users(where: UserOperationWhere): UserOperation @shareable
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }

            type User @shareable {
              name: String!
              posts(where: UserPostsOperationWhere): UserPostsOperation
            }

            type UserConnection @shareable {
              edges: [UserEdge]
              pageInfo: PageInfo
            }

            input UserConnectionSort {
              node: UserSort
            }

            type UserEdge @shareable {
              cursor: String
              node: User
            }

            type UserOperation @shareable {
              connection(after: String, first: Int, sort: [UserConnectionSort!]): UserConnection
            }

            input UserOperationWhere {
              AND: [UserOperationWhere!]
              NOT: UserOperationWhere
              OR: [UserOperationWhere!]
              node: UserWhere
            }

            type UserPostsConnection {
              edges: [UserPostsEdge]
              pageInfo: PageInfo
            }

            input UserPostsConnectionSort {
              edges: UserPostsEdgeSort
            }

            type UserPostsEdge {
              cursor: String
              node: Post
            }

            input UserPostsEdgeListWhere {
              AND: [UserPostsEdgeListWhere!]
              NOT: UserPostsEdgeListWhere
              OR: [UserPostsEdgeListWhere!]
              all: UserPostsEdgeWhere
              none: UserPostsEdgeWhere
              single: UserPostsEdgeWhere
              some: UserPostsEdgeWhere
            }

            input UserPostsEdgeSort {
              node: PostSort
            }

            input UserPostsEdgeWhere {
              AND: [UserPostsEdgeWhere!]
              NOT: UserPostsEdgeWhere
              OR: [UserPostsEdgeWhere!]
              node: PostWhere
            }

            input UserPostsNestedOperationWhere {
              AND: [UserPostsNestedOperationWhere!]
              NOT: UserPostsNestedOperationWhere
              OR: [UserPostsNestedOperationWhere!]
              edges: UserPostsEdgeListWhere
            }

            type UserPostsOperation {
              connection(after: String, first: Int, sort: [UserPostsConnectionSort!]): UserPostsConnection
            }

            input UserPostsOperationWhere {
              AND: [UserPostsOperationWhere!]
              NOT: UserPostsOperationWhere
              OR: [UserPostsOperationWhere!]
              edges: UserPostsEdgeWhere
            }

            input UserSort {
              name: SortDirection
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              name: StringWhere
              posts: UserPostsNestedOperationWhere
            }

            scalar _Any

            type _Service {
              sdl: String
            }

            scalar federation__FieldSet

            scalar link__Import

            enum link__Purpose {
              \\"\\"\\"
              \`EXECUTION\` features provide metadata necessary for operation execution.
              \\"\\"\\"
              EXECUTION
              \\"\\"\\"
              \`SECURITY\` features provide metadata necessary to securely resolve fields.
              \\"\\"\\"
              SECURITY
            }"
        `);
    });

    test("@key(resolvable: false)", async () => {
        const typeDefs = gql`
            extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

            type User @key(fields: "name", resolvable: false) @node {
                name: String!
            }

            type Post @node {
                content: String!
                author: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
            }
        `;

        // @ts-ignore
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver: jest.fn() });

        const printedSchema = printSchemaWithDirectives(
            lexicographicSortSchema(await neoSchema.getAuraSubgraphSchema())
        );

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema @link(url: \\"https://specs.apollo.dev/link/v1.0\\") @link(url: \\"https://specs.apollo.dev/federation/v2.0\\", import: [\\"@key\\"]) {
              query: Query
            }

            directive @federation__extends on INTERFACE | OBJECT

            directive @federation__external(reason: String) on FIELD_DEFINITION | OBJECT

            directive @federation__inaccessible on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @federation__override(from: String!) on FIELD_DEFINITION

            directive @federation__provides(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__requires(fields: federation__FieldSet!) on FIELD_DEFINITION

            directive @federation__shareable on FIELD_DEFINITION | OBJECT

            directive @federation__tag(name: String!) repeatable on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION

            directive @key(fields: federation__FieldSet!, resolvable: Boolean = true) repeatable on INTERFACE | OBJECT

            directive @link(as: String, for: link__Purpose, import: [link__Import], url: String) repeatable on SCHEMA

            type PageInfo @federation__shareable {
              endCursor: String
              hasNextPage: Boolean
              hasPreviousPage: Boolean
              startCursor: String
            }

            type Post {
              author(where: PostAuthorOperationWhere): PostAuthorOperation
              content: String!
            }

            type PostAuthorConnection {
              edges: [PostAuthorEdge]
              pageInfo: PageInfo
            }

            input PostAuthorConnectionSort {
              edges: PostAuthorEdgeSort
            }

            type PostAuthorEdge {
              cursor: String
              node: User
            }

            input PostAuthorEdgeListWhere {
              AND: [PostAuthorEdgeListWhere!]
              NOT: PostAuthorEdgeListWhere
              OR: [PostAuthorEdgeListWhere!]
              all: PostAuthorEdgeWhere
              none: PostAuthorEdgeWhere
              single: PostAuthorEdgeWhere
              some: PostAuthorEdgeWhere
            }

            input PostAuthorEdgeSort {
              node: UserSort
            }

            input PostAuthorEdgeWhere {
              AND: [PostAuthorEdgeWhere!]
              NOT: PostAuthorEdgeWhere
              OR: [PostAuthorEdgeWhere!]
              node: UserWhere
            }

            input PostAuthorNestedOperationWhere {
              AND: [PostAuthorNestedOperationWhere!]
              NOT: PostAuthorNestedOperationWhere
              OR: [PostAuthorNestedOperationWhere!]
              edges: PostAuthorEdgeListWhere
            }

            type PostAuthorOperation {
              connection(after: String, first: Int, sort: [PostAuthorConnectionSort!]): PostAuthorConnection
            }

            input PostAuthorOperationWhere {
              AND: [PostAuthorOperationWhere!]
              NOT: PostAuthorOperationWhere
              OR: [PostAuthorOperationWhere!]
              edges: PostAuthorEdgeWhere
            }

            type PostConnection {
              edges: [PostEdge]
              pageInfo: PageInfo
            }

            input PostConnectionSort {
              node: PostSort
            }

            type PostEdge {
              cursor: String
              node: Post
            }

            type PostOperation {
              connection(after: String, first: Int, sort: [PostConnectionSort!]): PostConnection
            }

            input PostOperationWhere {
              AND: [PostOperationWhere!]
              NOT: PostOperationWhere
              OR: [PostOperationWhere!]
              node: PostWhere
            }

            input PostSort {
              content: SortDirection
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              author: PostAuthorNestedOperationWhere
              content: StringWhere
            }

            type Query {
              _entities(representations: [_Any!]!): [_Entity]!
              _service: _Service!
              posts(where: PostOperationWhere): PostOperation
              users(where: UserOperationWhere): UserOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }

            type User @key(resolvable: false, fields: \\"name\\") {
              name: String!
            }

            type UserConnection {
              edges: [UserEdge]
              pageInfo: PageInfo
            }

            input UserConnectionSort {
              node: UserSort
            }

            type UserEdge {
              cursor: String
              node: User
            }

            type UserOperation {
              connection(after: String, first: Int, sort: [UserConnectionSort!]): UserConnection
            }

            input UserOperationWhere {
              AND: [UserOperationWhere!]
              NOT: UserOperationWhere
              OR: [UserOperationWhere!]
              node: UserWhere
            }

            input UserSort {
              name: SortDirection
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
              name: StringWhere
            }

            scalar _Any

            union _Entity = User

            type _Service {
              sdl: String
            }

            scalar federation__FieldSet

            scalar link__Import

            enum link__Purpose {
              \\"\\"\\"
              \`EXECUTION\` features provide metadata necessary for operation execution.
              \\"\\"\\"
              EXECUTION
              \\"\\"\\"
              \`SECURITY\` features provide metadata necessary to securely resolve fields.
              \\"\\"\\"
              SECURITY
            }"
        `);
    });
});
