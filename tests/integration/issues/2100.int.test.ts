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

describe("https://github.com/neo4j/graphql/issues/2100", () => {
    const testHelper = new TestHelper();
    let token: string;

    let BacentaType: UniqueType;
    let ServiceLogType: UniqueType;
    let BussingRecordType: UniqueType;
    let TimeGraphType: UniqueType;

    let Member: UniqueType;

    let typeDefs: string;

    beforeEach(async () => {
        BacentaType = testHelper.createUniqueType("Bacenta");
        ServiceLogType = testHelper.createUniqueType("ServiceLog");
        BussingRecordType = testHelper.createUniqueType("BussingRecord");
        TimeGraphType = testHelper.createUniqueType("TimeGraph");

        Member = testHelper.createUniqueType("Member");

        typeDefs = `
            type ${ServiceLogType} {
                id: ID
                records: [Record!]! @relationship(type: "HAS_BUSSING", direction: OUT)
            }
            type ${BussingRecordType} implements Record {
                id: ID!
                attendance: Int
                markedAttendance: Boolean!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:PRESENT_AT_SERVICE|ABSENT_FROM_SERVICE]-(member:${Member})
                        RETURN COUNT(member) > 0 AS markedAttendance
                        """,
                        columnName: "markedAttendance"
                    )
                serviceDate: ${TimeGraphType}! @relationship(type: "BUSSED_ON", direction: OUT)
            }
    
            interface Church {
                id: ID
                name: String!
                serviceLogs: [${ServiceLogType}!]! @declareRelationship
            }
    
            type ${BacentaType} implements Church @authentication {
                id: ID @id @unique
                name: String!
                serviceLogs: [${ServiceLogType}!]! @relationship(type: "HAS_HISTORY", direction: OUT)
                bussing(limit: Int!): [${BussingRecordType}!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_HISTORY]->(:${ServiceLogType})-[:HAS_BUSSING]->(records:${BussingRecordType})-[:BUSSED_ON]->(date:${TimeGraphType})
                        WITH DISTINCT records, date LIMIT $limit
                        RETURN records ORDER BY date.date DESC
                        """
                        columnName: "records"
                    )
            }
    
            type ${TimeGraphType} @authentication {
                date: Date
            }
    
            interface Record {
                id: ID!
                attendance: Int
                markedAttendance: Boolean!
                serviceDate: ${TimeGraphType}! @declareRelationship
            }
            `;

        await testHelper.executeCypher(
            `
                CREATE (b:${BacentaType} {id: "1"})
                SET b.name =  "test"
                
                WITH b
                MERGE p=(b)-[:HAS_HISTORY]->(:${ServiceLogType} {id: 2})-[:HAS_BUSSING]->(record:${BussingRecordType} {id: 3})-[:BUSSED_ON]->(date:${TimeGraphType} {date:date()})
                RETURN p;
                `
        );

        token = testHelper.createBearerToken("secret");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Example working", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = `
            query {
                ${BussingRecordType.plural} {
                  id
                  __typename
                  serviceDate {
                    date
                  }
                  markedAttendance
                }  
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeFalsy();
        expect((result?.data as any)[BussingRecordType.plural][0].id).toBe("3");
        expect((result?.data as any)[BussingRecordType.plural][0].__typename).toBe(BussingRecordType.name);
        expect((result?.data as any)[BussingRecordType.plural][0].markedAttendance).toBe(false);
    });

    test("Example 'Variable not found'", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = `
            query DisplayBacentaServices($id: ID!) {
                ${BacentaType.plural}(where: {id: $id}) {
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

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: {
                id: 1,
            },
        });

        expect(result.errors).toBeFalsy();
    });
});
