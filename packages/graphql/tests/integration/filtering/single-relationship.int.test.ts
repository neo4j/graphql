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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Single relationship (1-*) filtering", () => {
    let Person: UniqueType;
    let Movie: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Person = testHelper.createUniqueType("Person");
        Movie = testHelper.createUniqueType("Movie");

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

        await testHelper.executeCypher(`
                CREATE (:${Movie} {title: "The Matrix", released: 1999})
                CREATE (:${Movie} {title: "The Italian Job", released: 1969})
                CREATE (:${Movie} {title: "The Italian Job", released: 2003})
                CREATE (:${Movie} {title: "The Lion King", released: 1994})
            `);
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Filter on required and optional relationships", async () => {
        const query = `
            query {
                ${Movie.plural}(where: { OR: [{ director: { name: "Jon Wu" } }, { producer: { name: "Jon Wu" } }] }) {
                    title
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE(jw:${Person} {name: "Jon Wu"})
            CREATE(:${Movie} {title: "Hard Target"})<-[:DIRECTED]-(jw)
            CREATE(cb:${Movie} {title: "Chi bi"})<-[:DIRECTED]-(jw)
            CREATE(cb)<-[:PRODUCED]-(jw)
            CREATE(m:${Movie} {title: "Avatar"})<-[:DIRECTED]-(:${Person} {name: "Richie McFamous"})
        `);

        const result = await testHelper.executeGraphQL(query);

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

        await testHelper.executeCypher(`
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

        const result = await testHelper.executeGraphQL(query);

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

        await testHelper.executeCypher(`
            CREATE(jw:${Person} {name: "Jon Wu"})
            CREATE(:${Movie} {title: "Hard Target"})<-[:DIRECTED]-(jw)
            CREATE(cb:${Movie} {title: "Chi bi"})<-[:DIRECTED]-(jw)
            CREATE(cb)<-[:PRODUCED]-(jw)
            CREATE(m:${Movie} {title: "Avatar"})<-[:DIRECTED]-(:${Person} {name: "Richie McFamous"})
        `);

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect((result.data as any)[Movie.plural]).toBeEmpty();
    });
});
