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

import { Driver } from "neo4j-driver";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../../src/utils/test/graphql-types";

describe("assertConstraints", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw an error when all necessary constraints do not exist", async () => {
        const type = generateUniqueType("Book");
        console.log(type);

        const typeDefs = `
            type ${type.name} {
                isan: String! @unique
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.assertConstraints({ driver })).rejects.toThrow(
            `Missing constraint for ${type.name}.isan`
        );
    });

    test("should not throw an error when all necessary constraints exist", async () => {
        const type = generateUniqueType("Book");
        console.log(type);

        const typeDefs = `
            type ${type.name} {
                isan: String! @unique
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const session = driver.session();

        const cypher = `CREATE CONSTRAINT ${type.name}_isan ON (n:${type.name}) ASSERT n.isan IS UNIQUE`;

        try {
            await session.run(cypher);
        } finally {
            await session.close();
        }

        await expect(neoSchema.assertConstraints({ driver })).resolves.not.toThrow();
    });

    test("should create a constraint if it doesn't exist and specified in options", async () => {
        const type = generateUniqueType("Book");
        console.log(type);

        const typeDefs = `
            type ${type.name} {
                isan: String! @unique
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.assertConstraints({ driver, options: { create: true } })).resolves.not.toThrow();

        const session = driver.session();

        const cypher = `SHOW UNIQUE CONSTRAINTS WHERE "${type.name}" IN labelsOrTypes`;

        try {
            const result = await session.run(cypher);

            expect(result.records.map((record) => record.toObject())).toHaveLength(1);
        } finally {
            await session.close();
        }
    });
});
