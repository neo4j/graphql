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
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("Field Level Aggregations", () => {
    const secret = "the-secret";

    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    const Series = new UniqueType("Series");
    const Actor = new UniqueType("Actor");

    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${Series} {
                title: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "series_title_aggregator" } } }])
                cost: Float!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type ${Actor} {
                name: String!
                actedIn: [${Series}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type JWT @jwt {
                roles: [String!]!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: secret },
            },
        });
        session = await neo4j.getSession();

        await session.run(`
            CREATE (a:${Actor} {name: "Keanu"})-[:ACTED_ON  {screenTime: 10}]->(:${Series} {title: "Doctor Who", cost: 10.0, episodes: 5000})
        `);
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("fail title validation", async () => {
        const query = `
            query {
                ${Series.operations.aggregate} {
                    title {
                        longest
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["movies-reader", "series-reader", "series-title-reader"] });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("fail title validation in nested query", async () => {
        const query = `
            query {
                ${Actor.plural} {
                    actedInAggregate {
                        node {
                            title {
                                longest
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { roles: ["movies-reader", "series-reader", "series-title-reader"] });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
