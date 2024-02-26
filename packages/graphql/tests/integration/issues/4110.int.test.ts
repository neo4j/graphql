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
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4110", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let Company: UniqueType;
    let InBetween: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Company = new UniqueType("User");
        InBetween = new UniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Company}
                @authorization(
                    filter: [{ operations: [READ], where: { node: { inBetween: { company: { id: "example" } } } } }]
                ) {
                id: ID @id
                inBetween: ${InBetween} @relationship(type: "CONNECT_TO", direction: OUT)
            }
            type ${InBetween} {
                id: ID @id
                company: ${Company}! @relationship(type: "CONNECT_TO", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    beforeEach(async () => {
        await session.run(`
            CREATE (c1:${Company} { id: "example" })
            CREATE (c2:${Company} { id: "another" })

            CREATE (ib1:${InBetween} {id: "id1"})
            CREATE (ib2:${InBetween} {id: "id2"})

            CREATE(ib1)<-[:CONNECT_TO]-(c1)
            CREATE(ib2)<-[:CONNECT_TO]-(c2)
        `);
    });

    afterEach(async () => {
        await cleanNodesUsingSession(session, [Company, InBetween]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("filters companies on nested auth where", async () => {
        const query = /* GraphQL */ `
            query {
                ${Company.plural} {
                    id
                    inBetween {
                        company {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret);

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();
        expect((result.data as any)[Company.plural]).toEqual([
            {
                id: "example",
                inBetween: {
                    company: {
                        id: "example",
                    },
                },
            },
        ]);
    });
});
