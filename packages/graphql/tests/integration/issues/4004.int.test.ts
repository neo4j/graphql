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
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4004", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    const typeEpisode = new UniqueType("Episode");
    const typeSeries = new UniqueType("Series");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query allEpisodes with argument named as options", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type ${typeEpisode.name} {
                id: ID!
            }

            type ${typeSeries.name} {
                id: ID!
                allEpisodes(options: [Int!]!): [${typeEpisode.name}!]!
                    @cypher(
                        statement: """
                        MATCH(this)<-[:IN_SERIES]-(episode:${typeEpisode.name})
                        RETURN episode as n LIMIT $options[0]
                        """
                        columnName: "n"
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
        query {
            ${typeSeries.plural} {
                allEpisodes(options: [2]) {
                    id
                }
            }
        }
        `;

        try {
            await session.run(
                `
                    CREATE (m:${typeSeries.name} { id: randomUUID() })
                    CREATE (m)<-[:IN_SERIES]-(:${typeEpisode.name} { id: randomUUID() })
                    CREATE (m)<-[:IN_SERIES]-(:${typeEpisode.name} { id: randomUUID() })
                    CREATE (m)<-[:IN_SERIES]-(:${typeEpisode.name} { id: randomUUID() })
                `
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();
            expect(result.data?.[typeSeries.plural]).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        allEpisodes: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
                    }),
                ])
            );
        } finally {
            await session.close();
        }
    });
});
