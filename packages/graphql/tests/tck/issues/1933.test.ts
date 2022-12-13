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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1933", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Employee {
                employeeId: ID! @id(autogenerate: false)
                firstName: String! @readonly
                lastName: String @readonly
                projects: [Project!]!
                    @relationship(type: "PARTICIPATES", direction: OUT, properties: "EmployeeParticipationProperties")
            }

            interface EmployeeParticipationProperties @relationshipProperties {
                allocation: Float
            }

            type Project {
                projectId: ID! @id(autogenerate: false)
                name: String! @readonly
                description: String
                employees: [Employee!]!
                    @relationship(type: "PARTICIPATES", direction: IN, properties: "EmployeeParticipationProperties")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should compare for SUM_LTE allocation in return statement rather than the WITH clause", async () => {
        const query = gql`
            {
                employees(where: { projectsAggregate: { edge: { allocation_SUM_LTE: 25 } } }) {
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Employee\`)
            CALL {
                WITH this
                MATCH (this:\`Employee\`)-[this0:PARTICIPATES]->(this1:\`Project\`)
                RETURN sum(this0.allocation) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            CALL {
                WITH this
                MATCH (this)-[this_projectsAggregate_this0:PARTICIPATES]->(this_projectsAggregate_this1:\`Project\`)
                RETURN count(this) AS this_projectsAggregate_var2
            }
            CALL {
                WITH this
                MATCH (this)-[this_projectsAggregate_this0:PARTICIPATES]->(this_projectsAggregate_this1:\`Project\`)
                        RETURN {min: min(this_projectsAggregate_this0.allocation), max: max(this_projectsAggregate_this0.allocation), average: avg(this_projectsAggregate_this0.allocation), sum: sum(this_projectsAggregate_this0.allocation)}  AS this_projectsAggregate_var3
            }
            RETURN this { .employeeId, .firstName, .lastName, projectsAggregate: { count: this_projectsAggregate_var2, edge: { allocation: this_projectsAggregate_var3 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 25
            }"
        `);
    });

    test("should compare for LTE allocation in return statement", async () => {
        const query = gql`
            {
                employees(where: { projectsAggregate: { edge: { allocation_LTE: 25 } } }) {
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Employee\`)
            CALL {
                WITH this
                MATCH (this:\`Employee\`)-[this0:PARTICIPATES]->(this1:\`Project\`)
                RETURN any(var2 IN collect(this0.allocation) WHERE var2 <= $param0) AS var3
            }
            WITH *
            WHERE var3 = true
            CALL {
                WITH this
                MATCH (this)-[this_projectsAggregate_this0:PARTICIPATES]->(this_projectsAggregate_this1:\`Project\`)
                RETURN count(this) AS this_projectsAggregate_var2
            }
            CALL {
                WITH this
                MATCH (this)-[this_projectsAggregate_this0:PARTICIPATES]->(this_projectsAggregate_this1:\`Project\`)
                        RETURN {min: min(this_projectsAggregate_this0.allocation), max: max(this_projectsAggregate_this0.allocation), average: avg(this_projectsAggregate_this0.allocation), sum: sum(this_projectsAggregate_this0.allocation)}  AS this_projectsAggregate_var3
            }
            RETURN this { .employeeId, .firstName, .lastName, projectsAggregate: { count: this_projectsAggregate_var2, edge: { allocation: this_projectsAggregate_var3 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 25
            }"
        `);
    });
});
