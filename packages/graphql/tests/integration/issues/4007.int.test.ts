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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "graphql-tag";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/4007", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return name from aliased selection", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                m:${typeMovie.plural}(where: { title: "${movieTitle}" }) {
                    t:actorsConnection {
                        e:edges {
                            no:node {
                                ne:name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any).m[0].t.e[0].no.ne).toBeDefined();
        } finally {
            await session.close();
        }
    });
});
