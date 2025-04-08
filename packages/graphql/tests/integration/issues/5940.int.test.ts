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

describe("https://github.com/neo4j/graphql/issues/5940", () => {
    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            union Production = ${Movie} | ${Series}

            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} @node {
                title: String!
                episodes: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("correct _single filters", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} {title:"The Office"})
            CREATE(s:${Series} {title:"The Office"})
            CREATE(a1:${Actor} {name:"Arthur"})
            CREATE(a2:${Actor} {name:"Marvin"})

            CREATE(a1)-[:ACTED_IN]->(m)
            CREATE(a1)-[:ACTED_IN]->(s)
            CREATE(a2)-[:ACTED_IN]->(s)
        `);

        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(
                    where: {
                        actedIn: { 
                            single: {
                                ${Movie}: { title_CONTAINS: "The Office" }
                                ${Series}: { title_ENDS_WITH: "Office" }
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Actor.plural]: [
                {
                    name: "Marvin",
                },
            ],
        });
    });

    test("correct _some filters", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} {title:"The Office"})
            CREATE(s:${Series} {title:"The Office"})
            CREATE(a1:${Actor} {name:"Arthur"})
            CREATE(a2:${Actor} {name:"Marvin"})
            CREATE(a3:${Actor} {name:"Zaphod"})

            CREATE(a1)-[:ACTED_IN]->(m)
            CREATE(a1)-[:ACTED_IN]->(s)
            CREATE(a2)-[:ACTED_IN]->(s)
        `);

        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(
                    where: {
                        actedIn: { some: { ${Movie}: { title_CONTAINS: "The Office" }, ${Series}: { title_ENDS_WITH: "Office" } } }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Arthur",
                },
                {
                    name: "Marvin",
                },
            ]),
        });
    });

    test("correct _all filters", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} {title:"The Office"})
            CREATE(s:${Series} {title:"The Office"})
            CREATE(s2:${Series} {title:"Another show"})
            CREATE(a1:${Actor} {name:"Arthur"})
            CREATE(a2:${Actor} {name:"Marvin"})
            CREATE(a3:${Actor} {name:"Zaphod"})

            CREATE(a1)-[:ACTED_IN]->(m)
            CREATE(a1)-[:ACTED_IN]->(s)
            CREATE(a1)-[:ACTED_IN]->(s2)
            CREATE(a2)-[:ACTED_IN]->(s)
            CREATE(a2)-[:ACTED_IN]->(m)
        `);

        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(
                    where: {
                        actedIn: { all: { ${Movie}: { title_CONTAINS: "The Office" }, ${Series}: { title_ENDS_WITH: "Office" } } }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Marvin",
                },
            ]),
        });
    });

    test("correct _none filters", async () => {
        await testHelper.executeCypher(`
            CREATE(m:${Movie} {title:"The Office"})
            CREATE(s:${Series} {title:"The Office"})
            CREATE(s2:${Series} {title:"Another show"})
            CREATE(a1:${Actor} {name:"Arthur"})
            CREATE(a2:${Actor} {name:"Marvin"})
            CREATE(a3:${Actor} {name:"Zaphod"})

            CREATE(a1)-[:ACTED_IN]->(m)
            CREATE(a1)-[:ACTED_IN]->(s)
            CREATE(a2)-[:ACTED_IN]->(s2)
        `);

        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(
                    where: {
                        actedIn: { none: { ${Movie}: { title_CONTAINS: "The Office" }, ${Series}: { title_ENDS_WITH: "Office" } } }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Zaphod",
                },
                {
                    name: "Marvin",
                },
            ]),
        });
    });
});
