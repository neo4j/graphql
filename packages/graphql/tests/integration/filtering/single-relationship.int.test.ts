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

import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("Single relationship (1-*) filtering", () => {
    const Person = new UniqueType("Person");
    const Movie = new UniqueType("Movie");

    let driver: Driver;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();

        const typeDefs = `
        type ${Person} {
            name: String!
            actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            directedMovies: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            producedMovies: [${Movie}!]! @relationship(type: "PRODUCED", direction: OUT)
        }

        type ${Movie} {
            title: String!
            actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: OUT)
            director: ${Person}! @relationship(type: "DIRECTED", direction: IN)
            producer: ${Person} @relationship(type: "PRODUCED", direction: IN)
        }
    `;

        session = await neo4j.getSession();
        await session.run(`
                CREATE (:${Movie} {title: "The Matrix", released: 1999})
                CREATE (:${Movie} {title: "The Italian Job", released: 1969})
                CREATE (:${Movie} {title: "The Italian Job", released: 2003})
                CREATE (:${Movie} {title: "The Lion King", released: 1994})
            `);

        driver = await neo4j.getDriver();

        neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    it("Filter on required and optional relationships", async () => {
        const query = `
            query {
                ${Movie.plural}(where: { OR: [{ director: { name: "Jon Wu" } }, { producer: { name: "Jon Wu" } }] }) {
                    title
                }
            }
        `;

        await session.run(`
            CREATE(jw:${Person} {name: "Jon Wu"})
            CREATE(:${Movie} {title: "Hard Target"})<-[:DIRECTED]-(jw)
            CREATE(cb:${Movie} {title: "Chi bi"})<-[:DIRECTED]-(jw)
            CREATE(cb)<-[:PRODUCED]-(jw)
            CREATE(m:${Movie} {title: "Avatar"})<-[:DIRECTED]-(:${Person} {name: "Richie McFamous"})
        `);

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Movie.plural]).toIncludeSameMembers([
            {
                title: "Chi bi",
            },
            { title: "Hard Target" },
        ]);
    });

    it("Filter on required and optional relationships in nested queries", async () => {
        const query = `
            query {
                ${Person.plural}(
                    where: { actedIn: { OR: [{ director: { name: "Jon Wu" } }, { producer: { name: "Jon Wu" } }] } }
                ) {
                    name
                }
            }
        `;

        await session.run(`
            CREATE(a:${Person} {name: "That actor that you are not so sure what the name is but have seen before"})
            CREATE(a2:${Person} {name: "not so famous one"})
            CREATE(a3:${Person} {name: "don't know this one"})



            CREATE(jw:${Person} {name: "Jon Wu"})
            CREATE(ht:${Movie} {title: "Hard Target"})<-[:DIRECTED]-(jw)
            CREATE(cb:${Movie} {title: "Chi bi"})<-[:DIRECTED]-(jw)
            CREATE(cb)<-[:PRODUCED]-(jw)
            CREATE(m:${Movie} {title: "Avatar"})<-[:DIRECTED]-(:${Person} {name: "Richie McFamous"})

            CREATE(a)-[:ACTED_IN]->(ht)
            CREATE(a)-[:ACTED_IN]->(cb)
            CREATE(a2)-[:ACTED_IN]->(cb)
            CREATE(a)-[:ACTED_IN]->(m)
            CREATE(a3)-[:ACTED_IN]->(m)
        `);

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeUndefined();
        expect((result.data as any)[Person.plural]).toIncludeSameMembers([
            {
                name: "That actor that you are not so sure what the name is but have seen before",
            },
            {
                name: "not so famous one",
            },
        ]);
    });

    it("Filter on optional relationships without results", async () => {
        const query = `
            query {
                ${Movie.plural}(where: { producer: { name: "Uw Noj" } } ) {
                    title
                }
            }
        `;

        await session.run(`
            CREATE(jw:${Person} {name: "Jon Wu"})
            CREATE(:${Movie} {title: "Hard Target"})<-[:DIRECTED]-(jw)
            CREATE(cb:${Movie} {title: "Chi bi"})<-[:DIRECTED]-(jw)
            CREATE(cb)<-[:PRODUCED]-(jw)
            CREATE(m:${Movie} {title: "Avatar"})<-[:DIRECTED]-(:${Person} {name: "Richie McFamous"})
        `);

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Movie.plural]).toBeEmpty();
    });
});
