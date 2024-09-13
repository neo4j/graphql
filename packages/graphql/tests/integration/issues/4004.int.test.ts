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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4004", () => {
    const testHelper = new TestHelper();

    let typeEpisode: UniqueType;
    let typeSeries: UniqueType;

    beforeAll(() => {
        typeEpisode = testHelper.createUniqueType("Episode");
        typeSeries = testHelper.createUniqueType("Series");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should query allEpisodes with argument named as options", async () => {
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

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
        query {
            ${typeSeries.plural} {
                allEpisodes(options: [2]) {
                    id
                }
            }
        }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${typeSeries.name} { id: randomUUID() })
                    CREATE (m)<-[:IN_SERIES]-(:${typeEpisode.name} { id: randomUUID() })
                    CREATE (m)<-[:IN_SERIES]-(:${typeEpisode.name} { id: randomUUID() })
                    CREATE (m)<-[:IN_SERIES]-(:${typeEpisode.name} { id: randomUUID() })
                `
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data?.[typeSeries.plural]).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    allEpisodes: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
                }),
            ])
        );
    });
});
