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

describe("https://github.com/neo4j/graphql/issues/1287", () => {
    const testHelper = new TestHelper();

    let screeningsType: UniqueType;
    let norwegianScreenable: UniqueType;

    let typeDefs: string;

    beforeEach(() => {
        screeningsType = testHelper.createUniqueType("Screening");
        norwegianScreenable = testHelper.createUniqueType("NorwegianScreenableMeta");

        typeDefs = `
            type ${screeningsType} {
                id: ID! @id @unique
                title: String
                beginsAt: DateTime!
                movie: ${norwegianScreenable}! @relationship(type: "SCREENS_MOVIE", direction: OUT)
            }
    
            interface ScreenableMeta {
                id: ID!
                spokenLanguage: String!
                subtitlesLanguage: String!
                premiere: DateTime!
                locale: LocalTime!
            }
    
            type ${norwegianScreenable} implements ScreenableMeta {
                id: ID! @id @unique
                spokenLanguage: String!
                subtitlesLanguage: String!
                premiere: DateTime!
                locale: LocalTime!
                ediNumber: String!
            }
        `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test(`should not throw "Cannot read property 'name' of undefined"`, async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `
            query queryScreenings {
                ${screeningsType.plural}(where: { movieConnection: { node: { id: "my-id" } } }) {
                    beginsAt
                    movie {
                        id
                    }
                }
            }
        `;

        const res = await testHelper.executeGraphQL(query);

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [screeningsType.plural]: [],
        });
    });
});
