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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

const testLabel = generate({ charset: "alphabetic" });

describe("fragments", () => {
    let driver: Driver;
    const typeDefs = gql`
        interface Entity {
            username: String!
        }

        type User implements Entity {
            id: ID!
            email: String!
            username: String!
        }
    `;

    const { schema } = new Neo4jGraphQL({ typeDefs });

    const id = generate();
    const email = generate({ charset: "alphabetic" });
    const username = generate({ charset: "alphabetic" });

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();
        await session.run(
            `
                CREATE (user:User:${testLabel})
                SET user = $user
            `,
            { user: { id, email, username } }
        );
        await session.close();
    });

    afterAll(async () => {
        const session = driver.session();
        await session.run(`
            MATCH (node:${testLabel})
            DETACH DELETE node
        `);
        await driver.close();
    });

    test("should be able project fragment on type", async () => {
        const query = gql`
            query($id: ID!) {
                users(where: { id: $id }) {
                    email
                    ...FragmentOnType
                }
            }

            fragment FragmentOnType on User {
                username
            }
        `;
        const graphqlResult = await graphql({
            schema,
            source: query.loc!.source,
            contextValue: { driver },
            variableValues: { id },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlUsers: Array<{ email: string; username: string }> = graphqlResult.data?.users;

        expect(graphqlUsers).toHaveLength(1);
        expect(graphqlUsers[0].email).toBe(email);
        expect(graphqlUsers[0].username).toBeDefined();
        expect(graphqlUsers[0].username).toBe(username);
    });

    test("should be able project fragment on interface", async () => {
        const query = gql`
            query($id: ID!) {
                users(where: { id: $id }) {
                    email
                    ...FragmentOnInterface
                }
            }

            fragment FragmentOnInterface on Entity {
                username
            }
        `;
        const graphqlResult = await graphql({
            schema,
            source: query.loc!.source,
            contextValue: { driver },
            variableValues: { id },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlUsers: Array<{ email: string; username: string }> = graphqlResult.data?.users;

        expect(graphqlUsers).toHaveLength(1);
        expect(graphqlUsers[0].email).toBe(email);
        expect(graphqlUsers[0].username).toBeDefined();
        expect(graphqlUsers[0].username).toBe(username);
    });
});
