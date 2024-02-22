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
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/2574", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let A: UniqueType;
    let B: UniqueType;
    let D: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        A = new UniqueType("A");
        B = new UniqueType("B");
        D = new UniqueType("D");

        session = await neo4j.getSession();

        const typeDefs = `
            type ${A} {
                uuid: ID! @id @unique
                child: ${D}! @relationship(type: "HAS_PARENT", direction: IN)
            }

            type ${B} {
                uuid: ID! @id @unique
                child: ${D}! @relationship(type: "HAS_PARENT", direction: IN)
            }

            union C = ${A} | ${B}

            type ${D} {
                uuid: ID! @id @unique
                test: String!
                parent: C! @relationship(type: "HAS_PARENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(driver, [A, B, D]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create birectional union relationship without error", async () => {
        const query = `
            mutation Mutation($input: [${A}CreateInput!]!) {
                ${A.operations.create}(input: $input) {
                    ${A.plural} {
                        child {
                            test
                        }
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: {
                input: {
                    child: {
                        create: {
                            node: {
                                test: "bla",
                            },
                        },
                    },
                },
            },
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [A.operations.create]: {
                [A.plural]: [
                    {
                        child: {
                            test: "bla",
                        },
                    },
                ],
            },
        });
    });
});
