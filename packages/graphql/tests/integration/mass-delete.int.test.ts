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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Mass Delete", () => {
    const testHelper = new TestHelper();

    let typeDefs: DocumentNode;
    let personType: UniqueType;
    let movieType: UniqueType;

    beforeEach(async () => {
        personType = testHelper.createUniqueType("Person");
        movieType = testHelper.createUniqueType("Movie");

        typeDefs = gql`
            type ${personType.name} {
                name: String!
                born: Int!
                movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${movieType.name} {
                title: String!
                released: Int
                actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE (m:${movieType.name} { title: "Sharknado", released: 2013 })
            WITH *
            UNWIND range(0, 100) AS x
            CREATE (p:${personType.name} { born: 1000+x, name: "Shark "+x })
            CREATE (m2:${movieType.name} { title: "Sharknado "+x, released: 2013 })
            CREATE (p)-[:ACTED_IN]->(m)
            CREATE (p)-[:ACTED_IN]->(m2)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Should successfully delete many nodes in the same query", async () => {
        const mutation = `
            mutation {
                ${movieType.operations.update}(delete: { actors: { where: { node: { name_CONTAINS: "Shark" } } } }) {
                    ${movieType.plural} {
                        title
                    }
                    info {
                        nodesDeleted
                    }
                }
            }
        `;

        const expectedMovies = Array.from(Array(101).keys()).map((x) => {
            return { title: `Sharknado ${x}` };
        });
        expectedMovies.push({ title: "Sharknado" });

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.operations.update]: {
                [movieType.plural]: expect.toIncludeSameMembers(expectedMovies),
                info: {
                    nodesDeleted: 101,
                },
            },
        });
    });
});
