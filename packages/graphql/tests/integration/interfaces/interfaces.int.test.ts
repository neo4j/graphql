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

import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("Interfaces tests", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();

    const SomeNodeType = testHelper.createUniqueType("SomeNode");
    const OtherNodeType = testHelper.createUniqueType("OtherNode");
    const MyImplementationType = testHelper.createUniqueType("MyImplementation");

    beforeAll(async () => {
        const typeDefs = `
            type ${SomeNodeType} {
                id: ID! @id @unique
                other: ${OtherNodeType}! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }
            type ${OtherNodeType} {
                id: ID! @id @unique
                interfaceField: MyInterface! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }
            interface MyInterface {
                id: ID!
            }
            type ${MyImplementationType} implements MyInterface {
                id: ID! @id @unique
            }

            extend type ${SomeNodeType} @authentication

            extend type ${OtherNodeType} @authentication
        `;

        await testHelper.executeCypher(`
            CREATE(:${SomeNodeType} { id: "1" })-[:HAS_OTHER_NODES]->(other:${OtherNodeType} { id: "2" })
            CREATE(other)-[:HAS_INTERFACE_NODES]->(:${MyImplementationType} { id: "3" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should not throw error when querying nested interfaces having auth rules", async () => {
        const query = `
            query {
                ${SomeNodeType.plural} {
                    id
                    other {
                        interfaceField {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [SomeNodeType.plural]: [
                {
                    id: "1",
                    other: {
                        interfaceField: {
                            id: "3",
                        },
                    },
                },
            ],
        });
    });
});
