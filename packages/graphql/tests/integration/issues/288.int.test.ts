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

describe("https://github.com/neo4j/graphql/issues/288", () => {
    const testHelper = new TestHelper();
    let USER: UniqueType;
    let COMPANY: UniqueType;

    let typeDefs: string;

    beforeAll(() => {
        USER = testHelper.createUniqueType("USER");
        COMPANY = testHelper.createUniqueType("COMPANY");

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
        await testHelper.close();
    });

    test("COMPANYID can be populated on create and update", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

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

        await neoSchema.checkNeo4jCompat();

        const createResult = await testHelper.executeGraphQL(createMutation);

        expect(createResult.errors).toBeFalsy();

        expect((createResult?.data as any)[USER.operations.create][USER.plural]).toEqual([
            { USERID: userid, COMPANYID: companyid1 },
        ]);

        const updateResult = await testHelper.executeGraphQL(updateMutation);

        expect(updateResult.errors).toBeFalsy();

        expect((updateResult?.data as any)[USER.operations.update][USER.plural]).toEqual([
            { USERID: userid, COMPANYID: companyid2 },
        ]);

        await testHelper.executeCypher(`MATCH (u:${USER}) WHERE u.USERID = "${userid}" DELETE u`);
    });
});
