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
import { cleanNodes } from "../../utils/clean-nodes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2560", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let User: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        User = generateUniqueType("User");

        const typeDefs = `
            type ${User} {
                firstName: String!
                lastName: String!
                fullName: String! @customResolver(requires: ["firstName", "lastName"])
            }
        `;

        // Pass resolvers as an array of objects instead of an object
        const resolvers = [
            {
                [User.name]: {
                    fullName(source) {
                        return `${source.firstName} ${source.lastName}`;
                    },
                },
            },
        ];

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            resolvers,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [User]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should accept resolvers as an array of objects", async () => {
        const mutation = `
            mutation {
                ${User.operations.create}(input: [{ firstName: "Tom", lastName: "Hanks" }]) {
                    ${User.plural} {
                        firstName
                        lastName
                        fullName
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [User.operations.create]: {
                [User.plural]: [
                    {
                        firstName: "Tom",
                        lastName: "Hanks",
                        fullName: "Tom Hanks",
                    },
                ],
            },
        });
    });
});
