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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { IncomingMessage } from "http";
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { translateQuery, formatCypher } from "../../tck/utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/190", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let bookmarks: string[];
    let req: IncomingMessage;
    const typeDefs = gql`
        type ServiceLog {
            id: ID
            records: [Record!]! @relationship(type: "HAS_BUSSING", direction: OUT)
        }
        type BussingRecord implements Record {
            id: ID!
            attendance: Int
            markedAttendance: Boolean!
                @cypher(
                    statement: """
                    MATCH (this)<-[:PRESENT_AT_SERVICE|ABSENT_FROM_SERVICE]-(member:Member)
                    RETURN COUNT(member) > 0 AS markedAttendance
                    """
                )
            serviceDate: TimeGraph! @relationship(type: "BUSSED_ON", direction: OUT)
        }

        interface Church @auth(rules: [{ isAuthenticated: true }]) {
            id: ID @id
            name: String!
            serviceLogs: [ServiceLog!]! @relationship(type: "HAS_HISTORY", direction: OUT)
        }

        type Bacenta implements Church {
            id: ID @id
            name: String!
            serviceLogs: [ServiceLog!]! @relationship(type: "HAS_HISTORY", direction: OUT)
            bussing(limit: Int!): [BussingRecord!]!
                @cypher(
                    statement: """
                    MATCH (this)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(records:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
                    WITH DISTINCT records, date LIMIT $limit
                    RETURN records ORDER BY date.date DESC
                    """
                )
        }

        type TimeGraph @auth(rules: [{ isAuthenticated: true }]) {
            date: Date
        }

        interface Record {
            id: ID!
            attendance: Int
            markedAttendance: Boolean!
                @cypher(
                    statement: """
                    MATCH (this)<-[:PRESENT_AT_SERVICE|ABSENT_FROM_SERVICE]-(member:Member)
                    RETURN COUNT(member) > 0 AS markedAttendance
                    """
                )
            serviceDate: TimeGraph! @relationship(type: "BUSSED_ON", direction: OUT)
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                CREATE (b:Bacenta {id: "1"})
                SET b.name =  "test"
                
                WITH b
                MERGE p=(b)-[:HAS_HISTORY]->(:ServiceLog {id: 2})-[:HAS_BUSSING]->(record:BussingRecord {id: 3})-[:BUSSED_ON]->(date:TimeGraph {date:date()})
                RETURN p;
                `
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }

        req = createJwtRequest("secret");
    });

    afterAll(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(
                "MATCH (b:Bacenta {id: 1})-[:HAS_HISTORY]->(s:ServiceLog {id: 2})-[:HAS_BUSSING]->(record:BussingRecord {id: 3})-[:BUSSED_ON]->(date:TimeGraph {date:date()}) DETACH DELETE b,s, record, date"
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Example working", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = `
            query {
                bussingRecords {
                  id
                  __typename
                  serviceDate {
                    date
                  }
                  markedAttendance
                }  
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks, { req }),
            });

            expect(result.errors).toBeFalsy();
            expect((result?.data as any)?.bussingRecords[0].id).toBe("3");
            expect((result?.data as any)?.bussingRecords[0].__typename).toBe("BussingRecord");
            expect((result?.data as any)?.bussingRecords[0].serviceDate.date).toBe("2022-09-16");
            expect((result?.data as any)?.bussingRecords[0].markedAttendance).toBe(false);
        } finally {
            await session.close();
        }
    });

    test("Example 'Variable not found'", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = `
            query DisplayBacentaServices($id: ID!) {
                bacentas(where: {id: $id}) {
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

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {
                    id: 1,
                },
                contextValue: neo4j.getContextValuesWithBookmarks(bookmarks, { req }),
            });

            const cypherRes = await translateQuery(neoSchema, gql(query), {
                req,
                variableValues: {
                    id: 1,
                },
            });
            console.log("CYPHER:", formatCypher(cypherRes.cypher));

            // console.log("ERR", result.errors?.[0]);
            expect(result.errors).toBeFalsy();

            console.log(JSON.stringify(result.data));
            /*
            expect((result?.data as any)?.bacentas[0].id).toBe("1");
            expect((result?.data as any)?.bacentas[0].name).toBe("test");
            expect((result?.data as any)?.bacentas[0].bussing).toIncludeSameMembers([
                {
                    id: "3",
                    attendance: null,
                    markedAttendance: false,
                    serviceDate: { date: "2022-09-16", __typename: "TimeGraph" },
                    __typename: "BussingRecord",
                },
            ]);
            */
        } finally {
            await session.close();
        }
    });
});
