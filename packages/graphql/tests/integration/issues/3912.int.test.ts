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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/3912", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let neoSchema: Neo4jGraphQL;

    const Event = new UniqueType("Event");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = /* GraphQL */ `
            enum EventPrivacy {
                PRIVATE
                VISIBLE
                PUBLIC
            }

            type ${Event} {
                id: ID! @id
                name: String!
                # The Privacy for the Event --> See Enum
                privacy: EventPrivacy @default(value: PRIVATE)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
    });

    test("Create sets default enum value correctly", async () => {
        const query = `#graphql
            mutation {
                ${Event.operations.create}(input: [{ name: "Event" }]) {
                    ${Event.plural} {
                        name
                        privacy
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Event.operations.create]: {
                [Event.plural]: [
                    {
                        name: "Event",
                        privacy: "PRIVATE",
                    },
                ],
            },
        });
    });
});
