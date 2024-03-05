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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/288", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let USER: UniqueType;
    let COMPANY: UniqueType;

    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        USER = new UniqueType("USER");
        COMPANY = new UniqueType("COMPANY");

        typeDefs = `
            type ${USER} {
                USERID: String
                COMPANYID: String
                COMPANY: [${COMPANY}!]! @relationship(type: "IS_PART_OF", direction: OUT)
            }

            type ${COMPANY} {
                USERS: [${USER}!]! @relationship(type: "IS_PART_OF", direction: IN)
            }
    `;
    });

    afterAll(async () => {
        await driver.close();
    });

    test("COMPANYID can be populated on create and update", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const userid = generate({ charset: "alphabetic" });
        const companyid1 = generate({ charset: "alphabetic" });
        const companyid2 = generate({ charset: "alphabetic" });

        const createMutation = `
            mutation {
                ${USER.operations.create}(input: { USERID: "${userid}", COMPANYID: "${companyid1}" }) {
                    ${USER.plural} {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        const updateMutation = `
            mutation {
                ${USER.operations.update}(where: { USERID: "${userid}" }, update: { COMPANYID: "${companyid2}" }) {
                    ${USER.plural} {
                        USERID
                        COMPANYID
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const createResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutation,
                contextValue: neo4j.getContextValues(),
            });

            expect(createResult.errors).toBeFalsy();

            expect((createResult?.data as any)[USER.operations.create][USER.plural]).toEqual([
                { USERID: userid, COMPANYID: companyid1 },
            ]);

            const updateResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: updateMutation,
                contextValue: neo4j.getContextValues(),
            });

            expect(updateResult.errors).toBeFalsy();

            expect((updateResult?.data as any)[USER.operations.update][USER.plural]).toEqual([
                { USERID: userid, COMPANYID: companyid2 },
            ]);

            await session.run(`MATCH (u:${USER}) WHERE u.USERID = "${userid}" DELETE u`);
        } finally {
            await session.close();
        }
    });
});
