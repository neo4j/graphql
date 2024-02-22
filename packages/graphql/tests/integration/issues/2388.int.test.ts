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
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/2388", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    let PartAddress: UniqueType;
    let PartUsage: UniqueType;
    let Part: UniqueType;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        PartAddress = new UniqueType("PartAddress");
        PartUsage = new UniqueType("PartUsage");
        Part = new UniqueType("Part");
        session = await neo4j.getSession();

        const typeDefs = `
        type JWTPayload @jwt {
            roles: [String!]!
        }

        type ${PartAddress}
            @authorization(validate: [
                { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
            ])
        {
            id: ID! @id @unique
        }

        type ${PartUsage}
            @authorization(validate: [
                { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
            ])
        {
            partAddress: ${PartAddress}
            @relationship(type: "BELONGS_TO", direction: OUT)
        }

        type ${Part}
            @authorization(validate: [
                { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
            ])
        {
            partUsages: [${PartUsage}!]!
            @relationship(type: "USAGE_OF", direction: IN)
        }
        `;

        // Initialise data
        await session.run(`
            CREATE (p:${Part})<-[uo:USAGE_OF]-(pu:${PartUsage})-[bt:BELONGS_TO]->(pa:${PartAddress})
            SET pa.id = "123"
        `);

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

    afterEach(async () => {
        await cleanNodes(driver, [PartAddress, PartUsage, Part]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should returns the correct count without errors", async () => {
        const query = `
        query PartByNumber {
            ${Part.plural} {
                partUsagesAggregate(where: { partAddress: { id: "123" } }) {
                    count
                }
            }
          }
        `;

        const token = createBearerToken(secret, { roles: ["upstream", "downstream"] });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: {
                ...neo4j.getContextValues(),
                ...{ token },
            },
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Part.plural]: [
                {
                    partUsagesAggregate: {
                        count: 1,
                    },
                },
            ],
        });
    });
});
