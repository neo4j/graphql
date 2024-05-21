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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Connections Alias", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeEach(() => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    // using totalCount as the bear minimal selection
    test("should alias top level connection field and return correct totalCount", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actors: actorsConnection {
                        totalCount
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [{ actors: { totalCount: 3 } }],
        });
    });

    test("should alias totalCount", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        count: totalCount
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [{ actorsConnection: { count: 3 } }],
        });
    });

    // using hasNextPage as the bear minimal selection
    test("should alias pageInfo top level key", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pi:pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data as any).toEqual({
            [typeMovie.plural]: [{ actorsConnection: { pi: { hasNextPage: false } } }],
        });
    });

    test("should alias startCursor", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            sc:startCursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.sc).toBeDefined();
    });

    test("should alias endCursor", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            ec:endCursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.ec).toBeDefined();
    });

    test("should alias hasPreviousPage", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection {
                        pageInfo {
                            hPP:hasPreviousPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.hPP).toBeDefined();
    });

    test("should alias hasNextPage", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        pageInfo {
                            hNP:hasNextPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.pageInfo.hNP).toBeDefined();
    });

    test("should alias cursor", async () => {
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    actorsConnection(first: 1) {
                        edges {
                            c:cursor
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
            {
                movieTitle,
            }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].c).toBeDefined();
    });
});
