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
import { type Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4667", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;

    let MyThing: UniqueType;
    let MyStuff: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        MyThing = new UniqueType("MyThing");
        MyStuff = new UniqueType("MyStuff");

        const session = await neo4j.getSession();
        try {
            await session.run(`
            CREATE (:${MyThing} {id: "A"})-[:THE_STUFF]->(b1:${MyStuff} {id: "C"})
            CREATE (:${MyThing} {id: "B"})
        `);
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        await cleanNodes(driver, [MyThing, MyStuff]);
    });

    afterAll(async () => {
        await driver.close();
    });

    test("when passed null as argument of a relationship filter should check that a relationship does not exists", async () => {
        const typeDefs = /* GraphQL */ `
            type ${MyThing} {
                id: ID! @id
                stuff: ${MyStuff} @relationship(type: "THE_STUFF", direction: OUT)
            }

            type ${MyStuff} {
                id: ID! @id
                thing: ${MyThing} @relationship(type: "THE_STUFF", direction: IN)
            }
        `;
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        const query = /* GraphQL */ `
            query {
                ${MyThing.plural}(where: { stuff: null }) {
                    id
                    stuff {
                        id
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
            [MyThing.plural]: expect.toIncludeSameMembers([expect.objectContaining({ id: "B" })]),
        });
    });
});
