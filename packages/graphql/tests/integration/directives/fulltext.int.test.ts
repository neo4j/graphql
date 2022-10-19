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
import { graphql, GraphQLSchema } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { upperFirst } from "../../../src/utils/upper-first";
import { delay } from "../../../src/utils/utils";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";

function generatedTypeDefs(personType: UniqueType, movieType: UniqueType): string {
    return `
        type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }]) {
            name: String!
            born: Int!
            actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }

        type ${movieType.name} {
            title: String!
            released: Int!
            actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;
}

describe("@fulltext directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let generatedSchema: GraphQLSchema;
    let personType: UniqueType;
    let movieType: UniqueType;
    let databaseName: string;

    let MULTIDB_SUPPORT = true;

    const person1 = {
        name: "this is a name",
        born: 1984,
    };
    const person2 = {
        name: "This is a different name",
        born: 1985,
    };
    const person3 = {
        name: "Another name",
        born: 1986,
    };
    const movie1 = {
        title: "Some Title",
        released: 2001,
    };
    const movie2 = {
        title: "Another Title",
        released: 2002,
    };

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        databaseName = generate({ readable: true, charset: "alphabetic" });

        const cypher = `CREATE DATABASE ${databaseName}`;
        const session = driver.session();

        try {
            await session.run(cypher);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            }
        } finally {
            await session.close();
        }

        await delay(5000);
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cypher = `DROP DATABASE ${databaseName}`;

            const session = await neo4j.getSession();
            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }
        }
        await driver.close();
    });

    beforeEach(async () => {
        personType = generateUniqueType("Person");
        movieType = generateUniqueType("Movie");
        const typeDefs = generatedTypeDefs(personType, movieType);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        generatedSchema = await neoSchema.getSchema();
        await neoSchema.assertIndexesAndConstraints({
            driver,
            driverConfig: { database: databaseName },
            options: { create: true },
        });

        session = driver.session({ database: databaseName });

        try {
            const test = await session.run(
                `
                CREATE (person1:${personType.name})-[:ACTED_IN]->(movie1:${movieType.name})
                CREATE (person1)-[:ACTED_IN]->(movie2:${movieType.name})
                CREATE (person2:${personType.name})-[:ACTED_IN]->(movie1)
                CREATE (person3:${personType.name})-[:ACTED_IN]->(movie2)
                SET person1 = $person1
                SET person2 = $person2
                SET person3 = $person3
                SET movie1 = $movie1
                SET movie2 = $movie2
            `,
                { person1, person2, person3, movie1, movie2 }
            );
            console.log(test);
        } finally {
            await session.close();
        }
    });

    test("my test", async () => {
        const query = `
            query {
                ${personType.plural}Fulltext${upperFirst(personType.name)}Index(phrase: "a different name") {
                    score
                    ${personType.name} {
                        name
                    } 
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
        } finally {
            await session.close();
        }
    });
});
