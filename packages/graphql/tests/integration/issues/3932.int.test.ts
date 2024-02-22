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

describe("https://github.com/neo4j/graphql/issues/3932", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let neoSchema: Neo4jGraphQL;

    const Image = new UniqueType("Image");
    const Invite = new UniqueType("Invite");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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
