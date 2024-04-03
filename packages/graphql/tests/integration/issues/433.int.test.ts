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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/433", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Person: UniqueType;
    let typeDefs: string;

    beforeAll(() => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should recreate issue and return correct data", async () => {
        typeDefs = `
            # Cannot use 'type Node'
            type ${Movie} {
                title: String
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Person} {
                name: String
            }
        `;

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const personName = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
               ${Movie.plural}(where: {title: "${movieTitle}"}) {
                    title
                    actorsConnection(where: {}) {
                      edges {
                        node {
                          name
                        }
                      }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title: $movieTitle})<-[:ACTED_IN]-(:${Person} {name: $personName})
                `,
            { movieTitle, personName }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Movie.plural]: [
                {
                    title: movieTitle,
                    actorsConnection: {
                        edges: [{ node: { name: personName } }],
                    },
                },
            ],
        });
    });
});
