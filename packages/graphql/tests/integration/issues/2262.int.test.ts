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
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2262", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Component: UniqueType;
    let Process: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        Component = generateUniqueType("Component");
        Process = generateUniqueType("Process");

        session = await neo4j.getSession();

        const typeDefs = `
            type ${Component} {
                uuid: String
                upstreamProcess: ${Process} @relationship(type: "OUTPUT", direction: IN)
                downstreamProcesses: [${Process}!]! @relationship(type: "INPUT", direction: OUT)
            }

            type ${Process} {
                uuid: String
                componentOutputs: [${Component}!]! @relationship(type: "OUTPUT", direction: OUT)
                componentInputs: [${Component}!]! @relationship(type: "INPUT", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("nested update with create while using subscriptions should generate valid Cypher", async () => {
        await session.run(`CREATE(:${Component} {uuid: "c1"})<-[:OUTPUT]-(:${Process} {uuid: "p1"})`);
        const query = `
            query ComponentsProcesses {
                ${Component.plural}(where: { uuid: "c1" }) {
                    uuid
                    upstreamProcessConnection {
                        edges {
                            node {
                                uuid
                                componentInputsConnection(sort: [{ node: { uuid: DESC } }]) {
                                    edges {
                                        node {
                                            uuid
                                        }
                                    }
                                }
                            }
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
            [Component.plural]: [
                {
                    uuid: "c1",
                    upstreamProcessConnection: {
                        edges: [
                            {
                                node: {
                                    uuid: "p1",
                                    componentInputsConnection: {
                                        edges: [],
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
