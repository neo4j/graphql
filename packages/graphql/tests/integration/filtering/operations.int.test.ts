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

describe("Filtering Operations", () => {
    const personType = new UniqueType("Person");
    const movieType = new UniqueType("Movie");

    let driver: Driver;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();

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

        session = await neo4j.getSession();
        await session.run(`CREATE (:${movieType} {title: "The Matrix", released: 1999})
                CREATE (:${movieType} {title: "The Italian Job", released: 1969})
                CREATE (:${movieType} {title: "The Italian Job", released: 2003})
                CREATE (:${movieType} {title: "The Lion King", released: 1994})
            `);

        driver = await neo4j.getDriver();

        neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    });

    afterAll(async () => {
        await session.close();

        await driver.close();
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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeUndefined();

        const moviesResult = result.data?.[movieType.plural];
        expect(moviesResult).toEqual(
            expect.toIncludeSameMembers([
                { title: "The Italian Job", released: 2003 },
                { title: "The Lion King", released: 1994 },
            ]),
        );
    });
});
