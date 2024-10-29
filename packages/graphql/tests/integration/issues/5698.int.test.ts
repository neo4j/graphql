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

describe("https://github.com/neo4j/graphql/issues/5698", () => {
    let Movie: UniqueType;
    let Person: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                title: String
                released: Int
                director: ${Person}! @relationship(type: "DIRECTED", direction: IN)
                secondDirector: ${Person} @relationship(type: "ALSO_DIRECTED", direction: IN)
            }

            type ${Person} {
                name: String
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not return non-null 1-1 relationships when passing null", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", released: 1999})<-[:DIRECTED]-(:${Person} {name: "Keanu"})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { released: 1999, director: null }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [],
        });
    });

    test("should not return nullable 1-1 relationships when passing null", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", released: 1999})<-[:ALSO_DIRECTED]-(:${Person} {name: "Keanu"})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { released: 1999, secondDirector: null }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [],
        });
    });
});
