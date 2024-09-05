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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2100", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type ServiceLog @node {
                id: ID
                records: [Record!]! @relationship(type: "HAS_BUSSING", direction: OUT)
            }
            type BussingRecord implements Record @node {
                id: ID!
                attendance: Int
                markedAttendance: Boolean!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:PRESENT_AT_SERVICE|ABSENT_FROM_SERVICE]-(member:Member)
                        RETURN COUNT(member) > 0 AS markedAttendance
                        """
                        columnName: "markedAttendance"
                    )
                serviceDate: TimeGraph! @relationship(type: "BUSSED_ON", direction: OUT)
            }

            interface Church {
                id: ID
                name: String!
                serviceLogs: [ServiceLog!]! @declareRelationship
            }

            type Bacenta implements Church @node {
                id: ID @id @unique
                name: String!
                serviceLogs: [ServiceLog!]! @relationship(type: "HAS_HISTORY", direction: OUT)
                bussing(limit: Int!): [BussingRecord!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(records:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
                        WITH DISTINCT records, date LIMIT $limit
                        RETURN records ORDER BY date.date DESC
                        """
                        columnName: "records"
                    )
            }

            type TimeGraph @node {
                date: Date
            }

            interface Record {
                id: ID!
                attendance: Int
                markedAttendance: Boolean!
                serviceDate: TimeGraph! @declareRelationship
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query nested relations under a root connection field", async () => {
        const query = /* GraphQL */ `
            query {
                bacentas(where: { id: 1 }) {
                    id
                    name
                    bussing(limit: 10) {
                        id
                        attendance
                        markedAttendance
                        serviceDate {
                            date
                            __typename
                        }
                        __typename
                    }
                    __typename
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Bacenta)
            WHERE this.id = $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(records:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
                    WITH DISTINCT records, date LIMIT $param1
                    RETURN records ORDER BY date.date DESC
                }
                WITH records AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:BUSSED_ON]->(this2:TimeGraph)
                    WITH this2 { .date } AS this2
                    RETURN head(collect(this2)) AS var3
                }
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)<-[:PRESENT_AT_SERVICE|ABSENT_FROM_SERVICE]-(member:Member)
                        RETURN COUNT(member) > 0 AS markedAttendance
                    }
                    WITH markedAttendance AS this4
                    RETURN this4 AS var5
                }
                WITH this0 { .id, .attendance, markedAttendance: var5, serviceDate: var3 } AS this0
                RETURN collect(this0) AS var6
            }
            RETURN this { .id, .name, bussing: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
