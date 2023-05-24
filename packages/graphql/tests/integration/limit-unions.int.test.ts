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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src";
import { UniqueType } from "../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2197", () => {
    const bookType = new UniqueType("Book");
    const journalType = new UniqueType("Journal");
    const authorType = new UniqueType("Author");

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    beforeEach(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = await neo4j.getSession();

        const typeDefs = `
            union Publication = ${bookType} | ${journalType}

            type ${authorType} {
                name: String!
                publications: [Publication!]! @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
            }

            type ${bookType} @queryOptions(limit: { default: 2, max: 3 }) {
                title: String!
                author: [${authorType}!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type ${journalType} @queryOptions(limit: { default: 2, max: 3 }) {
                subject: String!
                author: [${authorType}!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            interface Wrote {
                words: Int!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

        await session.run(
            `
            CREATE (a:${authorType} {name: "Byron"})
            CREATE (b1:${bookType} {title: "book1"})
            CREATE (b2:${bookType} {title: "book2"})
            CREATE (b3:${bookType} {title: "book3"})
            CREATE (b4:${bookType} {title: "book4"})
            CREATE (j1:${journalType} {subject: "journal1"})
            CREATE (j2:${journalType} {subject: "journal2"})
            CREATE (j3:${journalType} {subject: "journal3"})
            CREATE (j4:${journalType} {subject: "journal4"})
            MERGE (a)-[:WROTE {words: 100}]->(b1)
            MERGE (a)-[:WROTE {words: 150}]->(b2)
            MERGE (a)-[:WROTE {words: 200}]->(b3)
            MERGE (a)-[:WROTE {words: 250}]->(b4)
            MERGE (a)-[:WROTE {words: 15}]->(j1)
            MERGE (a)-[:WROTE {words: 10}]->(j2)
            MERGE (a)-[:WROTE {words: 20}]->(j3)
            MERGE (a)-[:WROTE {words: 25}]->(j4)
            `
        );
    });

    afterEach(async () => {
        await session.run("MATCH (n) DETACH DELETE n");
        await driver.close();
    });

    test("@queryOptions is ignored on unions connection query", async () => {
        const query = `
            query {
                ${authorType.plural} {
                    name
                    publicationsConnection {
                        edges {
                            words
                            node {
                                ... on ${bookType.name} {
                                    title
                                }
                                ... on ${journalType.name} {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[authorType.plural]).toHaveLength(1);
        expect(result?.data?.[authorType.plural]?.[0].publicationsConnection.edges.length).toBeLessThanOrEqual(6);
    });

    test("@queryOptions and first argument are both ignored on unions connection query", async () => {
        const query = `
            query {
                ${authorType.plural} {
                    name
                    publicationsConnection(first: 3) {
                        edges {
                            words
                            node {
                                ... on ${bookType.name} {
                                    title
                                }
                                ... on ${journalType.name} {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[authorType.plural]).toHaveLength(1);
        expect(result?.data?.[authorType.plural]?.[0].publicationsConnection.edges.length).toBeLessThanOrEqual(3);
    });

    test("@queryOptions is ignored but options: { limit } work on unions standard query", async () => {
        const query = `
            query {
                ${authorType.plural} {
                  publications(options: { limit: 10 }) {
                    ... on ${bookType.name} {
                      title
                    }
                    ... on ${journalType.name} {
                      subject
                    }
                  }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[authorType.plural]).toHaveLength(1);
        expect(result?.data?.[authorType.plural]?.[0]?.publications.length).toBeLessThanOrEqual(6);
    });

    test("options: { limit } work on unions standard query", async () => {
        const query = `
            query {
                ${authorType.plural} {
                  publications(options: { limit: 4 }) {
                    ... on ${bookType.name} {
                      title
                    }
                    ... on ${journalType.name} {
                      subject
                    }
                  }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[authorType.plural]).toHaveLength(1);
        expect(result?.data?.[authorType.plural]?.[0]?.publications.length).toBeLessThanOrEqual(4);
    });
});
