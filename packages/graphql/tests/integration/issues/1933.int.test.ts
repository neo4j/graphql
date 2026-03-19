/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            type ${employeeType} @node {
                employeeId: ID!
                firstName: String! @settable(onCreate: false, onUpdate: false)
                lastName: String @settable(onCreate: false, onUpdate: false)
                projects: [${projectType}!]!
                    @relationship(type: "PARTICIPATES", direction: OUT, properties: "EmployeeParticipationProperties")
            }
        
            type EmployeeParticipationProperties @relationshipProperties {
                allocation: Float
            }
        
            type ${projectType} @node {
                projectId: ID!
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
                    projectsConnection {
                        aggregate {
                            count {
                                nodes
                            }
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
                    projectsConnection {
                        aggregate {
                            count {
                                nodes
                            }
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
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[employeeType.plural]).toEqual([
            {
                employeeId: "3332",
                firstName: "Emp2",
                lastName: "EmpLast2",
                projectsConnection: {
                    aggregate: {
                        count: { nodes: 2 },
                        edge: { allocation: { average: 25, max: 30, min: 20, sum: 50 } },
                    },
                },
            },
        ]);
    });
});
