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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/1139", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return __typename for union in cypher statement", async () => {
        const typeDefs = gql`
            union PostMovieUser = Post | Movie | User

            type Post {
                name: String
            }

            type Movie {
                name: String
            }

            type User {
                id: ID @id
                updates: [PostMovieUser!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[a:WROTE]->(wrote:Post)
                        WHERE a.date_added IS NOT NULL
                        WITH COLLECT(wrote{ .*, date_added: a.date_added, typename: 'WROTE' }) as updates1, this
                        MATCH (this)-[a:FOLLOWS]->(umb)
                        WHERE (umb:User or umb:Movie or umb:Blog) AND a.date_added IS NOT NULL
                        WITH updates1 + COLLECT(umb{ .*, date_added: a.date_added, typename: 'FOLLOWED' }) as allUpdates
                        UNWIND allUpdates as update
                        RETURN update
                        ORDER BY update.date_added DESC
                        LIMIT 5
                        """
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                users (where: { id: "test-id" }) {
                    updates {
                        __typename
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({ users: [] });
    });
});
