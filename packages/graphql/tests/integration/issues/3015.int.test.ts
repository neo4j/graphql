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
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/3015", () => {
    let neo4j: Neo4j;
    let session: Session;
    let driver: Driver;

    let NodeA: UniqueType;
    let NodeB: UniqueType;
    let Connected: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        NodeA = new UniqueType("NodeA");
        NodeB = new UniqueType("NodeB");
        Connected = new UniqueType("Connected");

        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("custom resolvers should correctly format dates", async () => {
        const typeDefs = `
            type ${NodeA} {
                name: String!
            }

            type ${NodeB} {
                name: String!
            }

            union EitherNode = ${NodeA} | ${NodeB}
            type ${Connected} {
                name: String!
                connections: [EitherNode]
                    @cypher(
                        statement: "MATCH (this)-[:LINKED_TO]->(a:${NodeA}) RETURN a as output UNION WITH this MATCH (this)-[:LINKED_TO]->(b:${NodeB}) RETURN b as output"
                        columnName: "output"
                    )
            }
        `;

        await session.run(`
            CREATE (a:${NodeA} {name: "testA"})
            CREATE (b:${NodeB} {name: "testB"})
            CREATE (c:${Connected} {name: "connectedB"})

            CREATE (a2:${NodeA} {name: "testA2"})
            CREATE (b2:${NodeB} {name: "testB2"})
            CREATE (c2:${Connected} {name: "connectedAB2"})

            CREATE(c)-[:LINKED_TO]->(b)
            CREATE(c2)-[:LINKED_TO]->(a2)
            CREATE(c2)-[:LINKED_TO]->(b2)
        `);

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${Connected.plural} {
                    name
                    connections {
                        ... on ${NodeB} {
                            name
                        }
                        ... on ${NodeA} {
                            name
                        }
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
            [Connected.plural]: expect.toIncludeSameMembers([
                {
                    name: "connectedB",
                    connections: expect.toIncludeSameMembers([
                        {
                            name: "testB",
                        },
                    ]),
                },
                {
                    name: "connectedAB2",
                    connections: expect.toIncludeSameMembers([
                        {
                            name: "testA2",
                        },
                        {
                            name: "testB2",
                        },
                    ]),
                },
            ]),
        });
    });
});
