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

import { gql } from "apollo-server";
import { graphql } from "graphql";
import { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../../src";
import { generateUniqueType } from "../../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../../utils/TestSubscriptionPlugin";
import neo4j from "../../neo4j";

describe("Subscriptions delete", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    const typeActor = generateUniqueType("Actor");
    const typeMovie = generateUniqueType("Movie");

    beforeAll(async () => {
        driver = await neo4j();
        plugin = new TestSubscriptionsPlugin();
        const typeDefs = gql`
            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typeMovie.name} {
                id: ID!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                subscriptions: plugin,
            } as any,
        });
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("simple delete with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.delete} {
                nodesDeleted
            }
        }
        `;

        await session.run(`
            CREATE (:${typeMovie.name} { id: "1" })
            CREATE (:${typeMovie.name} { id: "2" })
        `);

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.delete].nodesDeleted).toEqual(2);

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "delete",
                properties: { old: { id: "1" }, new: undefined },
            },
            {
                id: expect.any(Number),
                timestamp: expect.any(Number),
                event: "delete",
                properties: { old: { id: "2" }, new: undefined },
            },
        ]);
    });
});
