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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1779", () => {
    let personType: UniqueType;
    let schoolType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        personType = testHelper.createUniqueType("Person");
        schoolType = testHelper.createUniqueType("School");

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
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Does not throw error 'The EXISTS subclause is not valid inside a WITH or RETURN clause. '", async () => {
        const cypher = `
        CREATE (personA:${personType.name} { name: "A", age: 24 })-[:ATTENDS]->(schoolOld:${schoolType.name} { name: "Old" })
        CREATE (personB:${personType.name} { name: "B", age: 26 })-[:ATTENDS]->(schoolOld)
        CREATE (personC:${personType.name} { name: "C", age: 23 })-[:ATTENDS]->(schoolYoung:${schoolType.name} { name: "Young" })
        CREATE (personD:${personType.name} { name: "D", age: 25 })-[:ATTENDS]->(schoolYoung)
    `;

        await testHelper.executeCypher(cypher);

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

        const result = await testHelper.executeGraphQL(query);

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
