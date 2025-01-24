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

import { GraphQLSchema } from "graphql";
import { gql } from "graphql-tag";
import { validateSDL } from "../../../validate-sdl";
import { validateCypherDirective } from "./cypher";

describe.skip("cypher validation", () => {
    test("@cypher can be used in a object type that is a node", () => {
        const userDocument = gql`
            type User @node {
                id: ID!
                name: String!
                postContent: String
                    @cypher(
                        statement: "MATCH (this)-[:HAS_POST]->(p:Post) RETURN p.content as post_content"
                        columnName: "post_content"
                    )
            }
        `;
        const errors = validateSDL(userDocument, [validateCypherDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(0);
    });

    test("@cypher cannot be used in a object type that is not a node", () => {
        const userDocument = gql`
            type User {
                id: ID!
                name: String!
                postContent: String
                    @cypher(
                        statement: "MATCH (this)-[:HAS_POST]->(p:Post) RETURN p.content as post_content"
                        columnName: "post_content"
                    )
            }
        `;
        const errors = validateSDL(userDocument, [validateCypherDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(1);
        expect(errors).toEqual([
            expect.objectContaining({
                message:
                    'Directive "cypher" requires to be used within the "@node" directive or on root types: Query, and Mutation',
            }),
        ]);
    });

    test("@cypher can be used in a root type", () => {
        const userDocument = gql`
            type User @node {
                id: ID!
                name: String!
                postContent: String
            }

            type Query {
                users: [User] @cypher(statement: "MATCH (this:User) RETURN this as u", columnName: "u")
            }
        `;
        const errors = validateSDL(userDocument, [validateCypherDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(0);
    });
});
