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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { Neo4jGraphQLSubscriptionsSingleInstancePlugin } from "../../../src";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2261", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let ProgrammeItem: UniqueType;
    let Edition: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        ProgrammeItem = generateUniqueType("ProgrammeItem");
        Edition = generateUniqueType("Edition");

        session = await neo4j.getSession();

        const typeDefs = `
            interface Product {
                id: ID! @id
                uri: String!
            }

            type ${ProgrammeItem} implements Product {
                id: ID! @id
                uri: String! @cypher(statement: "RETURN 'example://programme-item/' + this.id")
                editions: [${Edition}!]! @relationship(type: "HAS_EDITION", direction: OUT)
            }

            type ${Edition} {
                id: ID! @id
                uri: String! @cypher(statement: "RETURN 'example://edition/' + this.id")
                product: Product! @relationship(type: "HAS_EDITION", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: new Neo4jGraphQLSubscriptionsSingleInstancePlugin(),
            },
        });
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("nested query with top level @cypher directive with subscriptions should return valid Cypher", async () => {
        await session.run(`CREATE (e:${Edition} {id: "ed-id"})<-[:HAS_EDITION]-(p:${ProgrammeItem} {id: "p-id"})`);

        const query = `
            query {
                ${Edition.plural} {
                    id
                    uri
                    product {
                        __typename
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Edition.plural]: [
                {
                    id: "ed-id",
                    uri: "example://edition/ed-id",
                    product: {
                        __typename: ProgrammeItem.name,
                    },
                },
            ],
        });
    });
});
