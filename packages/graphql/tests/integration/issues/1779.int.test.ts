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

import { graphql, GraphQLSchema } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1779", () => {
    const personType = new UniqueType("Person");
    const schoolType = new UniqueType("School");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
            type ${personType.name} {
                name: String
                age: Int
                attends: [${schoolType.name}!]! @relationship(type: "ATTENDS", direction: OUT)
            }

            type ${schoolType.name} {
                name: String
                students: [${personType.name}!]! @relationship(type: "ATTENDS", direction: IN)
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Does not throw error 'The EXISTS subclause is not valid inside a WITH or RETURN clause. '", async () => {
        const cypher = `
        CREATE (personA:${personType.name} { name: "A", age: 24 })-[:ATTENDS]->(schoolOld:${schoolType.name} { name: "Old" })
        CREATE (personB:${personType.name} { name: "B", age: 26 })-[:ATTENDS]->(schoolOld)
        CREATE (personC:${personType.name} { name: "C", age: 23 })-[:ATTENDS]->(schoolYoung:${schoolType.name} { name: "Young" })
        CREATE (personD:${personType.name} { name: "D", age: 25 })-[:ATTENDS]->(schoolYoung)
    `;

        const session = await neo4j.getSession();

        try {
            await session.run(cypher);
        } finally {
            await session.close();
        }

        const query = `
            {
                ${personType.plural} {
                    name
                    attends(where: { students_ALL: { age_GT: 23 } }) {
                        name
                    }
                }
            }
        `;

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[personType.plural]).toEqual(
            expect.toIncludeSameMembers([
                {
                    name: "A",
                    attends: [
                        {
                            name: "Old",
                        },
                    ],
                },
                {
                    name: "B",
                    attends: [
                        {
                            name: "Old",
                        },
                    ],
                },
                {
                    name: "C",
                    attends: [],
                },
                {
                    name: "D",
                    attends: [],
                },
            ])
        );
    });
});
