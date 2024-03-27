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

describe("https://github.com/neo4j/graphql/issues/402", () => {
    const testHelper = new TestHelper();
    let Event: UniqueType;
    let Area: UniqueType;
    let typeDefs: string;

    beforeAll(() => {
        Event = testHelper.createUniqueType("Event");
        Area = testHelper.createUniqueType("Area");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should recreate test and return correct data", async () => {
        typeDefs = `
            type ${Event} {
                id: ID!
                area: ${Area}! @relationship(type: "HAPPENS_IN", direction: OUT)
            }

            type ${Area} {
                id: ID!
            }
        `;

        const eventId = generate({
            charset: "alphabetic",
        });

        const areaId = generate({
            charset: "alphabetic",
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        // testing the missing non non-null array
        const query = `
            query ($area: [ID!]) {
               ${Event.plural} (
                 where: {
                   id: "${eventId}"
                   area: {
                     id_IN: $area
                   }
                 }
               )
               {
                 id
                 area {
                   id
                 }
               }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Event} {id: $eventId})-[:HAPPENS_IN]->(:${Area} {id: $areaId})
                `,
            { eventId, areaId }
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            [Event.plural]: [
                {
                    id: eventId,
                    area: { id: areaId },
                },
            ],
        });
    });
});
