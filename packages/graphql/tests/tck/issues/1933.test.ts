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
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)-[aggr_edge:PARTICIPATES]->(aggr_node:Project)
            RETURN sum(aggr_edge.allocation) <= toFloat($aggr_edge_allocation_SUM_LTE)
            \\", { this: this, aggr_edge_allocation_SUM_LTE: $aggr_edge_allocation_SUM_LTE })
            RETURN this { .employeeId, .firstName, .lastName, projectsAggregate: { count: size([(this)-[this_projectsAggregate_this1:PARTICIPATES]->(this_projectsAggregate_this0:\`Project\`) | this_projectsAggregate_this0]), edge: { allocation: head(apoc.cypher.runFirstColumnMany(\\"MATCH (this)-[r:PARTICIPATES]->(n:Project)
                    RETURN {min: min(r.allocation), max: max(r.allocation), average: avg(r.allocation), sum: sum(r.allocation)}\\", { this: this })) } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_allocation_SUM_LTE\\": 25
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
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)-[aggr_edge:PARTICIPATES]->(aggr_node:Project)
            RETURN aggr_edge.allocation <= $aggr_edge_allocation_LTE
            \\", { this: this, aggr_edge_allocation_LTE: $aggr_edge_allocation_LTE })
            RETURN this { .employeeId, .firstName, .lastName, projectsAggregate: { count: size([(this)-[this_projectsAggregate_this1:PARTICIPATES]->(this_projectsAggregate_this0:\`Project\`) | this_projectsAggregate_this0]), edge: { allocation: head(apoc.cypher.runFirstColumnMany(\\"MATCH (this)-[r:PARTICIPATES]->(n:Project)
                    RETURN {min: min(r.allocation), max: max(r.allocation), average: avg(r.allocation), sum: sum(r.allocation)}\\", { this: this })) } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_allocation_LTE\\": 25
            }"
        `);
    });
});
