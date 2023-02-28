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

import type { Driver } from "neo4j-driver";
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Relationship properties - read", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    const typeDefs = gql`
        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
        }

        type Actor {
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
        }

        interface ActedIn {
            screenTime: Int!
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.getSchema()).rejects.toThrow(
            "The `@relationshipProperties` directive could not be found on the `ActedIn` interface"
        );
    });
});
