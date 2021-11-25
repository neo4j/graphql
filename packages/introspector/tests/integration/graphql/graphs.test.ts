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

import * as neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "../../../src/index";
import createDriver from "../neo4j";

describe("GraphQL - Infer Schema on graphs", () => {
    const dbName = "introspectToNeo4jGrahqlTypeDefsGraphITDb";
    let driver: neo4j.Driver;
    let MULTIDB_SUPPORT = true;

    const sessionFactory = (bm: string[]) => () =>
        driver.session({ defaultAccessMode: neo4j.session.READ, bookmarks: bm, database: dbName });

    beforeAll(async () => {
        driver = await createDriver();
        const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            await cSession.writeTransaction((tx) => tx.run(`CREATE DATABASE ${dbName}`));
        } catch (e) {
            if (e instanceof Error) {
                if (
                    e.message.includes("should be executed against the system database") ||
                    e.message.includes("Unsupported administration command")
                ) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            } else {
                throw e;
            }
        }
        const waitSession = driver.session({
            defaultAccessMode: neo4j.session.READ,
            database: dbName,
            bookmarks: cSession.lastBookmark(),
        });
        await cSession.close();
        await waitSession.close();
    });
    afterEach(async () => {
        if (MULTIDB_SUPPORT) {
            const xSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
            await xSession.run("MATCH (n) DETACH DELETE n");
            await xSession.close();
        }
    });
    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
            try {
                await cSession.writeTransaction((tx) => tx.run(`DROP DATABASE ${dbName}`));
            } catch (e) {
                // ignore
            }
        }
        await driver.close();
    });

    test("Can introspect and generate on small graph with no rel properties", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const nodeProperties = { title: "Forrest Gump", name: "Glenn Hysén" };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (m:Movie {title: $props.title})
                CREATE (a:Actor {name: $props.name})
                MERGE (a)-[:ACTED_IN]->(m)
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));

        expect(typeDefs).toMatchInlineSnapshot(`
            "type Actor {
            	actedInMovies: [Movie] @relationship(type: \\"ACTED_IN\\", direction: OUT)
            	name: String!
            }

            type Movie {
            	actorsActedIn: [Actor] @relationship(type: \\"ACTED_IN\\", direction: IN)
            	title: String!
            }"
        `);

        expect(() => new Neo4jGraphQL({ typeDefs, driver })).not.toThrow();
    });
    test("Can introspect and generate multiple relationships (even with the same type)", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const nodeProperties = { title: "Forrest Gump", name: "Glenn Hysén" };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (m:Movie {title: $props.title})
                CREATE (p:Play {title: $props.title})
                CREATE (a:Actor {name: $props.name})
                CREATE (d:Dog {name: $props.name})
                MERGE (a)-[:ACTED_IN]->(p)
                MERGE (a)-[:ACTED_IN]->(m)
                MERGE (a)-[:DIRECTED]->(m)
                MERGE (d)-[:ACTED_IN]->(m)
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));
        expect(typeDefs).toMatchInlineSnapshot(`
            "type Actor {
            	actedInMovies: [Movie] @relationship(type: \\"ACTED_IN\\", direction: OUT)
            	actedInPlays: [Play] @relationship(type: \\"ACTED_IN\\", direction: OUT)
            	directedMovies: [Movie] @relationship(type: \\"DIRECTED\\", direction: OUT)
            	name: String!
            }

            type Dog {
            	actedInMovies: [Movie] @relationship(type: \\"ACTED_IN\\", direction: OUT)
            	name: String!
            }

            type Movie {
            	actorsActedIn: [Actor] @relationship(type: \\"ACTED_IN\\", direction: IN)
            	actorsDirected: [Actor] @relationship(type: \\"DIRECTED\\", direction: IN)
            	dogsActedIn: [Dog] @relationship(type: \\"ACTED_IN\\", direction: IN)
            	title: String!
            }

            type Play {
            	actorsActedIn: [Actor] @relationship(type: \\"ACTED_IN\\", direction: IN)
            	title: String!
            }"
        `);

        expect(() => new Neo4jGraphQL({ typeDefs, driver })).not.toThrow();
    });
    test("Can introspect and generate relationships with properties", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const nodeProperties = {
            title: "Loose it",
            name: "Glenn Hysén",
            name2: "Non payed person",
            roles: ["Footballer", "Drunken man on the street"],
            roles2: ["Palm tree"],
            skill: neo4j.int(4),
            pay: 200.5,
            str: "String",
            int: neo4j.int(1),
        };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (m:Movie {title: $props.title})
                CREATE (a:Actor {name: $props.name})
                CREATE (a2:Actor {name: $props.name2})
                MERGE (a)-[:ACTED_IN {roles: $props.roles, pay: $props.pay, amb: $props.str}]->(m)
                MERGE (a2)-[:ACTED_IN {roles: $props.roles, amb: $props.int}]->(m)
                MERGE (a)-[:DIRECTED {skill: $props.skill}]->(m)
                MERGE (a)<-[:WON_PRIZE_FOR]-(m)
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));
        expect(typeDefs).toMatchInlineSnapshot(`
            "interface ActedInProperties @relationshipProperties {
            	pay: Float
            	roles: [String]!
            }

            type Actor {
            	actedInMovies: [Movie] @relationship(type: \\"ACTED_IN\\", direction: OUT, properties: \\"ActedInProperties\\")
            	directedMovies: [Movie] @relationship(type: \\"DIRECTED\\", direction: OUT, properties: \\"DirectedProperties\\")
            	moviesWonPrizeFor: [Movie] @relationship(type: \\"WON_PRIZE_FOR\\", direction: IN)
            	name: String!
            }

            interface DirectedProperties @relationshipProperties {
            	skill: BigInt!
            }

            type Movie {
            	actorsActedIn: [Actor] @relationship(type: \\"ACTED_IN\\", direction: IN, properties: \\"ActedInProperties\\")
            	actorsDirected: [Actor] @relationship(type: \\"DIRECTED\\", direction: IN, properties: \\"DirectedProperties\\")
            	title: String!
            	wonPrizeForActors: [Actor] @relationship(type: \\"WON_PRIZE_FOR\\", direction: OUT)
            }"
        `);

        expect(() => new Neo4jGraphQL({ typeDefs, driver })).not.toThrow();
    });
    test("Can handle the larger character set from Neo4j", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            // eslint-disable-next-line jest/no-disabled-tests, jest/no-jasmine-globals
            pending();
            return;
        }

        const nodeProperties = {
            title: "Loose it",
            name: "Glenn Hysén",
            roles: ["Footballer", "Drunken man on the street"],
        };
        const wSession = driver.session({ defaultAccessMode: neo4j.session.WRITE, database: dbName });
        await wSession.writeTransaction((tx) =>
            tx.run(
                `CREATE (m:\`Movie-Label\` {title: $props.title})
                CREATE (a:\`Actor-Label\` {name: $props.name})
                MERGE (a)-[:\`ACTED-IN\` {roles: $props.roles}]->(m)
                MERGE (a)<-[:WON_PRIZE_FOR]-(m)
                `,
                { props: nodeProperties }
            )
        );
        const bm = wSession.lastBookmark();
        await wSession.close();

        const typeDefs = await toGraphQLTypeDefs(sessionFactory(bm));
        expect(typeDefs).toMatchInlineSnapshot(`
            "interface ActedInProperties @relationshipProperties {
            	roles: [String]!
            }

            type Actor_Label @node(label: \\"Actor-Label\\") {
            	actedInMovieLabels: [Movie_Label] @relationship(type: \\"ACTED-IN\\", direction: OUT, properties: \\"ActedInProperties\\")
            	movieLabelsWonPrizeFor: [Movie_Label] @relationship(type: \\"WON_PRIZE_FOR\\", direction: IN)
            	name: String!
            }

            type Movie_Label @node(label: \\"Movie-Label\\") {
            	actorLabelsActedIn: [Actor_Label] @relationship(type: \\"ACTED-IN\\", direction: IN, properties: \\"ActedInProperties\\")
            	title: String!
            	wonPrizeForActorLabels: [Actor_Label] @relationship(type: \\"WON_PRIZE_FOR\\", direction: OUT)
            }"
        `);

        expect(() => new Neo4jGraphQL({ typeDefs, driver })).not.toThrow();
    });
});
