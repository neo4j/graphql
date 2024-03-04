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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1760", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;
    const secret = "secret";

    let ApplicationVariant: UniqueType;
    let NameDetails: UniqueType;
    let Market: UniqueType;
    let BaseObject: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        ApplicationVariant = new UniqueType("ApplicationVariant");
        NameDetails = new UniqueType("NameDetails");
        Market = new UniqueType("Market");
        BaseObject = new UniqueType("BaseObject");

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

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver, features: { authorization: { key: secret } } });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
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
        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeFalsy();
    });
});
