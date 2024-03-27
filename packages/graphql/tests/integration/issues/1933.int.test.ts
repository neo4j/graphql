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

describe("https://github.com/neo4j/graphql/issues/1933", () => {
    let employeeType: UniqueType;
    let projectType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        employeeType = testHelper.createUniqueType("Employee");
        projectType = testHelper.createUniqueType("Project");

        const typeDefs = `
            type ${employeeType} {
                employeeId: ID! @unique
                firstName: String! @settable(onCreate: false, onUpdate: false)
                lastName: String @settable(onCreate: false, onUpdate: false)
                projects: [${projectType}!]!
                    @relationship(type: "PARTICIPATES", direction: OUT, properties: "EmployeeParticipationProperties")
            }
        
            type EmployeeParticipationProperties @relationshipProperties {
                allocation: Float
            }
        
            type ${projectType} {
                projectId: ID! @unique
                name: String! @settable(onCreate: false, onUpdate: false)
                description: String
                employees: [${employeeType}!]!
                    @relationship(type: "PARTICIPATES", direction: IN, properties: "EmployeeParticipationProperties")
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        const cypher = `
            CREATE (e1:${employeeType} { employeeId: "3331", firstName: "Emp1", lastName: "EmpLast1" })
            CREATE (e2:${employeeType} { employeeId: "3332", firstName: "Emp2", lastName: "EmpLast2" })
            CREATE (p1:${projectType} { id: "2221", name: "Test_proj" })
            CREATE (p2:${projectType} { id: "2222", name: "Test_proj2" })
            CREATE (e1)-[:PARTICIPATES { allocation: 35.0 }]->(p1)
            CREATE (e1)-[:PARTICIPATES { allocation: 40.0 }]->(p2)
            CREATE (e2)-[:PARTICIPATES { allocation: 30.0 }]->(p1)
            CREATE (e2)-[:PARTICIPATES { allocation: 20.0 }]->(p2)
        `;

        await testHelper.executeCypher(cypher);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return the correct elements based on a relationship aggregation SUM_LTE filter, zero elements match", async () => {
        const query = `
            {
                ${employeeType.plural}(where: { projectsAggregate: { edge: { allocation_SUM_LTE: 25 } } }) {
                    employeeId
                    firstName
                    lastName
                    projectsAggregate {
                        count
                        edge {
                            allocation {
                                max
                                min
                                average
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[employeeType.plural]).toEqual([]);
    });

    test("should return the correct elements based on a relationship aggregation SUM_LTE filter, one element matches", async () => {
        const query = `
            {
                ${employeeType.plural}(where: { projectsAggregate: { edge: { allocation_SUM_LTE: 55 } } }) {
                    employeeId
                    firstName
                    lastName
                    projectsAggregate {
                        count
                        edge {
                            allocation {
                                max
                                min
                                average
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[employeeType.plural]).toEqual([
            {
                employeeId: "3332",
                firstName: "Emp2",
                lastName: "EmpLast2",
                projectsAggregate: { count: 2, edge: { allocation: { average: 25, max: 30, min: 20, sum: 50 } } },
            },
        ]);
    });

    test("should return the correct elements based on a relationship aggregation LTE filter", async () => {
        // INFO: The behaviour/implementation of the LTE aggregation was not changed. This is just for comparison.
        const query = `
            {
                ${employeeType.plural}(where: { projectsAggregate: { edge: { allocation_LTE: 30 } } }) {
                    employeeId
                    firstName
                    lastName
                    projectsAggregate {
                        count
                        edge {
                            allocation {
                                max
                                min
                                average
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[employeeType.plural]).toEqual([
            {
                employeeId: "3332",
                firstName: "Emp2",
                lastName: "EmpLast2",
                projectsAggregate: { count: 2, edge: { allocation: { average: 25, max: 30, min: 20, sum: 50 } } },
            },
        ]);
    });
});
