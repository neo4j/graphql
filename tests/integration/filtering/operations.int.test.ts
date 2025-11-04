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

describe("Filtering Operations", () => {
    const testHelper = new TestHelper();
    let personType: UniqueType;
    let movieType: UniqueType;

    beforeEach(async () => {
        personType = testHelper.createUniqueType("Person");
        movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
        type ${personType} {
            name: String!
            age: Int!
            movies: [${movieType}!]! @relationship(type: "ACTED_IN", direction: IN)
        }

        type ${movieType} {
            title: String!
            released: Int!
            actors: [${personType}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }
    `;

        await testHelper.executeCypher(`CREATE (:${movieType} {title: "The Matrix", released: 1999})
                CREATE (:${movieType} {title: "The Italian Job", released: 1969})
                CREATE (:${movieType} {title: "The Italian Job", released: 2003})
                CREATE (:${movieType} {title: "The Lion King", released: 1994})
            `);

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    it("Combine AND and OR operations", async () => {
        const query = `
            query {
                ${movieType.plural}(where: { OR: [{ title: "The Italian Job", released: 2003 }, { title: "The Lion King" }] }) {
                    title
                    released
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        const moviesResult = result.data?.[movieType.plural];
        expect(moviesResult).toEqual(
            expect.toIncludeSameMembers([
                { title: "The Italian Job", released: 2003 },
                { title: "The Lion King", released: 1994 },
            ])
        );
    });
});
