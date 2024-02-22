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
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4196", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Foo: UniqueType;
    let Bar: UniqueType;
    let FooBar: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Foo = new UniqueType("Foo");
        Bar = new UniqueType("Bar");
        FooBar = new UniqueType("FooBar");

        const typeDefs = /* GraphQL */ `
            type ${Foo} {
                name: String
                bars: [${Bar}!]! @relationship(type: "relatesTo", direction: OUT)
            }
            
            type ${Bar} {
                name: String
                foobars: [${FooBar}!]! @relationship(type: "relatesTo", direction: OUT)
            }

            type ${FooBar} {
                name: String
                bars: [${FooBar}!]! @relationship(type: "relatesTo", direction: IN)
            }
        `;

        await session.run(`
            MERGE (:${Foo} {name: "A"})-[:relatesTo]->(b1:${Bar} {name: "bar1"})
            MERGE (:${Foo} {name: "B"})
            MERGE (:${Foo} {name: "C"})-[:relatesTo]->(b3:${Bar} {name: "bar3"})
            MERGE (b1)-[:relatesTo]->(:${FooBar} {name: "a"})
            MERGE (b3)-[:relatesTo]->(:${FooBar} {name: "b"})
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(driver, [Foo, Bar, FooBar]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("querying multiple nested nodes should be sorted correctly", async () => {
        const query = /* GraphQL */ `
            query {
                ${Foo.plural} (options: {sort: {name: ASC}}) {
                    name
                    bars {
                        foobars {
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

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Foo.plural]: [
                { name: "A", bars: [{ foobars: [{ name: "a" }] }] },
                { name: "B", bars: [] },
                { name: "C", bars: [{ foobars: [{ name: "b" }] }] },
            ],
        });
    });
});
