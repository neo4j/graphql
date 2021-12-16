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

import pluralize from "pluralize";
import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../../src/utils/test/graphql-types";

describe("Revert https://github.com/neo4j/graphql/pull/572", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create user without related friend in many-to-many relationship", async () => {
        const user = generateUniqueType("User");

        const typeDefs = gql`
        type ${user.name} {
            name: String!
            friends: [${user.name}!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
        }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                create${pluralize(user.name)}(input: { name: "Ford" }) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [`create${pluralize(user.name)}`]: {
                info: {
                    nodesCreated: 1,
                },
            },
        });
    });
});
