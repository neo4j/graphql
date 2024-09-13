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

describe("https://github.com/neo4j/graphql/issues/3932", () => {
    const testHelper = new TestHelper();

    let Image: UniqueType;
    let Invite: UniqueType;

    beforeAll(async () => {
        Image = testHelper.createUniqueType("Image");
        Invite = testHelper.createUniqueType("Invite");

        const typeDefs = /* GraphQL */ `
            enum ImageStatus {
                PENDING
                UPLOADED
            }

            type ${Image} {
                status: ImageStatus! @default(value: PENDING)
            }

            enum InviteStatus {
                PENDING
                ACCEPTED
            }

            type ${Invite} {
                status: InviteStatus! @default(value: PENDING)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Server starts up and defaults work", async () => {
        const query = `#graphql
            mutation {
                ${Image.operations.create}(input: [{}]) {
                    ${Image.plural} {
                        status
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Image.operations.create]: {
                [Image.plural]: [
                    {
                        status: "PENDING",
                    },
                ],
            },
        });
    });
});
