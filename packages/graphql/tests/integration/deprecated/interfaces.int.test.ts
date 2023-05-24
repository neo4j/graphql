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
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { IncomingMessage } from "http";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("Interfaces tests", () => {
    const secret = "the-secret";

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    const SomeNodeType = new UniqueType("SomeNode");
    const OtherNodeType = new UniqueType("OtherNode");
    const MyImplementationType = new UniqueType("MyImplementation");

    async function graphqlQuery(query: string, req: IncomingMessage) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ req }),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${SomeNodeType} {
                id: ID! @id
                other: ${OtherNodeType}! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }
            type ${OtherNodeType} {
                id: ID! @id
                interfaceField: MyInterface! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }
            interface MyInterface {
                id: ID! @id
            }
            type ${MyImplementationType} implements MyInterface {
                id: ID! @id
            }

            extend type ${SomeNodeType} @auth(rules: [{ isAuthenticated: true }])

            extend type ${OtherNodeType} @auth(rules: [{ isAuthenticated: true }])
        `;

        session = await neo4j.getSession();

        await session.run(`
            CREATE(:${SomeNodeType} { id: "1" })-[:HAS_OTHER_NODES]->(other:${OtherNodeType} { id: "2" })
            CREATE(other)-[:HAS_INTERFACE_NODES]->(:${MyImplementationType} { id: "3" })
        `);

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
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

        const req = createJwtRequest(secret, {});
        const queryResult = await graphqlQuery(query, req);
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
