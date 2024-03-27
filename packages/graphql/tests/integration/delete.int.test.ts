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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("delete", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should delete a single movie", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const mutation = `
        mutation($id: ID!) {
            ${Movie.operations.delete}(where: { id: $id }) {
              nodesDeleted
              relationshipsDeleted
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $id})
            `,
            { id }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.delete]).toEqual({ nodesDeleted: 1, relationshipsDeleted: 0 });

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id }
        );

        expect(reFind.records).toHaveLength(0);
    });

    test("should not delete a movie if predicate does not yield true", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const mutation = `
        mutation($id: ID!) {
            ${Movie.operations.delete}(where: { id: $id }) {
              nodesDeleted
              relationshipsDeleted
            }
          }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $id})
            `,
            { id }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id: "NOT FOUND" },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.delete]).toEqual({ nodesDeleted: 0, relationshipsDeleted: 0 });

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id }
        );

        expect(reFind.records).toHaveLength(1);
    });

    test("should delete a single movie and a single nested actor", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id: ID!, $name: String) {
                ${Movie.operations.delete}(where: { id: $id }, delete: { actors: { where: { node: { name: $name } } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m:${Movie} {id: $id})
                CREATE (a:${Actor} {name: $name})
                MERGE (a)-[:ACTED_IN]->(m)
            `,
            {
                id,
                name,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id, name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.delete]).toEqual({ nodesDeleted: 2, relationshipsDeleted: 1 });

        const movie = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id }
        );

        expect(movie.records).toHaveLength(0);

        const actor = await testHelper.executeCypher(
            `
              MATCH (a:${Actor} {name: $name})
              RETURN a
            `,
            { name }
        );

        expect(actor.records).toHaveLength(0);
    });

    test("should delete a movie, a single nested actor and another movie they act in", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($id1: ID!, $name: String, $id2: ID!) {
                ${Movie.operations.delete}(
                    where: { id: $id1 }
                    delete: { actors: { where: { node: { name: $name } }, delete: { movies: { where: { node: { id: $id2 } } } } } }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (m1:${Movie} {id: $id1})
                CREATE (a:${Actor} {name: $name})
                CREATE (m2:${Movie} {id: $id2})
                MERGE (a)-[:ACTED_IN]->(m1)
                MERGE (a)-[:ACTED_IN]->(m2)
            `,
            {
                id1,
                name,
                id2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { id1, name, id2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.delete]).toEqual({ nodesDeleted: 3, relationshipsDeleted: 2 });

        const movie1 = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id: id1 }
        );

        expect(movie1.records).toHaveLength(0);

        const actor = await testHelper.executeCypher(
            `
              MATCH (a:${Actor} {name: $name})
              RETURN a
            `,
            { name }
        );

        expect(actor.records).toHaveLength(0);

        const movie2 = await testHelper.executeCypher(
            `
              MATCH (m:${Movie} {id: $id})
              RETURN m
            `,
            { id: id2 }
        );

        expect(movie2.records).toHaveLength(0);
    });

    test("should delete a movie using a connection where filter", async () => {
        const typeDefs = gql`
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} {
                id: ID
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const title = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation($name: String) {
                ${Movie.operations.delete}(where: { actorsConnection: { node: { name: $name } } } ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {id: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                    CREATE (:${Movie} {id: $title})<-[:ACTED_IN]-(:${Actor} {name: randomUUID()})
                `,
            {
                title,
                name,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { name },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.delete]).toEqual({ nodesDeleted: 1, relationshipsDeleted: 1 });
    });
});
