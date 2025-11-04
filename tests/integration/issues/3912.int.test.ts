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

describe("https://github.com/neo4j/graphql/issues/3912", () => {
    const testHelper = new TestHelper();

    let Event: UniqueType;

    beforeAll(async () => {
        Event = testHelper.createUniqueType("Event");

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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
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

        const gqlResult = await testHelper.executeGraphQL(query);

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
