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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/402", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should recreate test and return correct data", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Event {
                id: ID!
                area: Area! @relationship(type: "HAPPENS_IN", direction: OUT)
            }

            type Area {
                id: ID!
            }
        `;

        const eventId = generate({
            charset: "alphabetic",
        });

        const areaId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        // testing the missing non non-null array
        const query = `
            query ($area: [ID!]) {
               events (
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

        try {
            await session.run(
                `
                    CREATE (:Event {id: $eventId})-[:HAPPENS_IN]->(:Area {id: $areaId})
                `,
                { eventId, areaId },
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data as any).toEqual({
                events: [
                    {
                        id: eventId,
                        area: { id: areaId },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });
});
