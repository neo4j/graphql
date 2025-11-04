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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1760", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let ApplicationVariant: UniqueType;
    let NameDetails: UniqueType;
    let Market: UniqueType;
    let BaseObject: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        ApplicationVariant = testHelper.createUniqueType("ApplicationVariant");
        NameDetails = testHelper.createUniqueType("NameDetails");
        Market = testHelper.createUniqueType("Market");
        BaseObject = testHelper.createUniqueType("BaseObject");

        typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
    
                interface BusinessObject {
                    id: ID!
                    nameDetails: ${NameDetails}
                }
    
                type ${ApplicationVariant} implements BusinessObject
                    @authorization(validate: [{ when: [BEFORE], where: { jwt: { roles_INCLUDES: "ALL" } } }])
                    @mutation(operations: []) {
                    markets: [${Market}!]! @relationship(type: "HAS_MARKETS", direction: OUT)
                    id: ID! @unique
                    relatedId: ID
                    @cypher(statement: "MATCH (this)<-[:HAS_BASE]-(n:${BaseObject}) RETURN n.id as res", columnName: "res")
                    baseObject: ${BaseObject}! @relationship(type: "HAS_BASE", direction: IN)
                    current: Boolean!
                    nameDetails: ${NameDetails} @relationship(type: "HAS_NAME", direction: OUT)
                }
    
                type ${NameDetails}
                    @authorization(validate: [{ when: [BEFORE], where: { jwt: { roles_INCLUDES: "ALL" } } }])
                    @mutation(operations: [])
                    @query(read: false, aggregate: false) {
                    fullName: String!
                }
    
                type ${Market} implements BusinessObject
                    @authorization(validate: [{ when: [BEFORE], where: { jwt: { roles_INCLUDES: "ALL" } } }])
                    @mutation(operations: []) {
                    id: ID! @unique
                    nameDetails: ${NameDetails} @relationship(type: "HAS_NAME", direction: OUT)
                }
    
                type ${BaseObject}
                    @authorization(validate: [{ when: [BEFORE], where: { jwt: { roles_INCLUDES: "ALL" } } }])
                    @mutation(operations: []) {
                    id: ID! @id @unique
                }
            `;

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("provided query does not result in an error", async () => {
        const query = `
            query getApplicationVariants {
                ${ApplicationVariant.plural}(where: {
                    current: true,
                }, options: {
                    sort: {
                        relatedId: ASC,
                    },
                    offset: 0,
                    limit: 50,
                },) {
                    relatedId
                    nameDetailsConnection {
                        edges {
                            node {
                                fullName
                            }
                        }
                    }
                    marketsConnection {
                        edges {
                            node {
                                nameDetailsConnection {
                                    edges {
                                        node {
                                            fullName
                                        }
                                    }
                                }
                            }
                        }
                    }
                    baseObjectConnection {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["ALL"] });
        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeFalsy();
    });
});
