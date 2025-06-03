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

describe("https://github.com/neo4j/graphql/issues/6349", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        typeDefs = /* GraphQL */ `
            type ${Movie.name} @node @limit(
                default: 3
                max: 3
            ) {
                id: ID!
                title: String!
                releaseDate: Date
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${Movie.name} { id: "1", title: "The Matrix", releaseDate: date("1999-03-31") })
            CREATE (:${Movie.name} { id: "2", title: "Inception", releaseDate: date("2010-07-16") })
            CREATE (:${Movie.name} { id: "3", title: "Interstellar", releaseDate: date("2014-11-07") })
            CREATE (:${Movie.name} { id: "4", title: "The Dark Knight", releaseDate: date("2008-07-18") })
            CREATE (:${Movie.name} { id: "5", title: "Pulp Fiction", releaseDate: date("1994-10-14") })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should apply limit to read operations", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    id
                    title
                    releaseDate
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Movie.plural]: expect.toBeArrayOfSize(3),
        });
    });

     test("should not apply limit to aggregate operations", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.operations.aggregate} {
                    count
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Movie.operations.aggregate]: {
                count: 5,
            },
        });
    });
    
});
