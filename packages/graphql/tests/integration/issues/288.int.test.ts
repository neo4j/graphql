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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/288", () => {
    let driver: Driver;
    const typeDefs = gql`
        type USER {
            USERID: String
            COMPANYID: String
            COMPANY: [COMPANY] @relationship(type: "IS_PART_OF", direction: OUT)
        }

        type COMPANY {
            USERS: [USER] @relationship(type: "IS_PART_OF", direction: IN)
        }
    `;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("COMPANYID can be populated on create and update", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const userid = generate({ charset: "alphabetic" });
        const companyid1 = generate({ charset: "alphabetic" });
        const companyid2 = generate({ charset: "alphabetic" });

        const createMutation = `
            mutation {
                createUSERS(input: { USERID: "${userid}", COMPANYID: "${companyid1}" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const updateMutation = `
            mutation {
                updateUSERS(where: { USERID: "${userid}" }, update: { COMPANYID: "${companyid2}" }) {
                    users {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const createResult = await graphql({
                schema: neoSchema.schema,
                source: createMutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(createResult.errors).toBeFalsy();

            expect(createResult?.data?.createUSERS?.users).toEqual([{ USERID: userid, COMPANYID: companyid1 }]);

            const updateResult = await graphql({
                schema: neoSchema.schema,
                source: updateMutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(updateResult.errors).toBeFalsy();

            expect(updateResult?.data?.updateUSERS?.users).toEqual([{ USERID: userid, COMPANYID: companyid2 }]);

            await session.run(`MATCH (u:USER) WHERE u.USERID = "${userid}" DELETE u`);
        } finally {
            await session.close();
        }
    });
});
