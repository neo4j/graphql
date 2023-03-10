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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1933", () => {
    const employeeType = new UniqueType("Employee");
    const projectType = new UniqueType("Project");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${employeeType} {
                employeeId: ID! @id(autogenerate: false)
                firstName: String! @readonly
                lastName: String @readonly
                projects: [${projectType}!]!
                    @relationship(type: "PARTICIPATES", direction: OUT, properties: "EmployeeParticipationProperties")
            }
        
            interface EmployeeParticipationProperties @relationshipProperties {
                allocation: Float
            }
        
            type ${projectType} {
                projectId: ID! @id(autogenerate: false)
                name: String! @readonly
                description: String
                employees: [${employeeType}!]!
                    @relationship(type: "PARTICIPATES", direction: IN, properties: "EmployeeParticipationProperties")
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();

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

        session = await neo4j.getSession();

        try {
            await session.run(cypher);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
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

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

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

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

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

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

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
