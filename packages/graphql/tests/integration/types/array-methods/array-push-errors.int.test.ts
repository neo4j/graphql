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

import { graphql, GraphQLError } from "graphql";
import { gql } from "apollo-server";
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";

import { generateUniqueType } from "../../../utils/graphql-types";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("array-push", () => {
    let driver: Driver;
    let session: Session;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    test("should throw an error when trying to push on to a non-existing array", async () => {
        const typeMovie = generateUniqueType("Movie");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String
                tags: [String]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = `
            mutation {
                ${typeMovie.operations.update} (update: { tags_PUSH: "test" }) {
                    ${typeMovie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        // Created deliberately without the tags property.
        const cypher = `
            CREATE (m:${typeMovie} {title:$movieTitle})
        `;

        await session.run(cypher, { movieTitle });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Property tags cannot be NULL"))
        ).toBeTruthy();

        expect(gqlResult.data).toBeNull();
    });
});
