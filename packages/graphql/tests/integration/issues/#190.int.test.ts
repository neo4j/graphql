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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/190", () => {
    let driver: Driver;
    const typeDefs = gql`
        type User {
            client_id: String
            uid: String
            demographics: [UserDemographics] @relationship(type: "HAS_DEMOGRAPHIC", direction: OUT)
        }

        type UserDemographics {
            client_id: String
            type: String
            value: String
            users: [User] @relationship(type: "HAS_DEMOGRAPHIC", direction: IN)
        }
    `;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                "CREATE (:User {uid: 'user1'}),(:User {uid: 'user2'}),(:UserDemographics{type:'Gender',value:'Female'}),(:UserDemographics{type:'Gender',value:'Male'}),(:UserDemographics{type:'Age',value:'50+'}),(:UserDemographics{type:'State',value:'VIC'})"
            );
            await session.run(
                "MATCH (u:User {uid: 'user1'}) MATCH (d:UserDemographics {type: 'Gender', value:'Female'}) CREATE (u)-[:HAS_DEMOGRAPHIC]->(d)"
            );
            await session.run(
                "MATCH (u:User {uid: 'user2'}) MATCH (d:UserDemographics {type: 'Gender', value:'Male'}) CREATE (u)-[:HAS_DEMOGRAPHIC]->(d)"
            );
            await session.run(
                "MATCH (u:User {uid: 'user1'}) MATCH (d:UserDemographics {type: 'Age', value:'50+'}) CREATE (u)-[:HAS_DEMOGRAPHIC]->(d)"
            );
            await session.run(
                "MATCH (u:User {uid: 'user2'}) MATCH (d:UserDemographics {type: 'Age', value:'50+'}) CREATE (u)-[:HAS_DEMOGRAPHIC]->(d)"
            );
            await session.run(
                "MATCH (u:User {uid: 'user1'}) MATCH (d:UserDemographics {type: 'State', value:'VIC'}) CREATE (u)-[:HAS_DEMOGRAPHIC]->(d)"
            );
            await session.run(
                "MATCH (u:User {uid: 'user2'}) MATCH (d:UserDemographics {type: 'State', value:'VIC'}) CREATE (u)-[:HAS_DEMOGRAPHIC]->(d)"
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run("MATCH (u:User) WHERE (u.uid = 'user1' OR u.uid = 'user2') DETACH DELETE u");
            await session.run(
                "MATCH (ud:UserDemographics) WHERE ((ud.type = 'Gender' AND ud.value = 'Female') OR (ud.type = 'Gender' AND ud.value = 'Male') OR (ud.type = 'Age' AND ud.value = '50+') OR (ud.type = 'State' AND ud.value = 'VIC')) DELETE ud"
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Example 1", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                users(where: { demographics: { type: "Gender", value: "Female" } }) {
                    uid
                    demographics {
                        type
                        value
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.users).toEqual([
                {
                    uid: "user1",
                    demographics: [
                        {
                            type: "State",
                            value: "VIC",
                        },
                        {
                            type: "Age",
                            value: "50+",
                        },
                        {
                            type: "Gender",
                            value: "Female",
                        },
                    ],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("Example 2", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                users(
                    where: {
                        demographics: { OR: [{ type: "Gender", value: "Female" }, { type: "State" }, { type: "Age" }] }
                    }
                ) {
                    uid
                    demographics {
                        type
                        value
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.users).toEqual([
                {
                    uid: "user1",
                    demographics: [
                        {
                            type: "State",
                            value: "VIC",
                        },
                        {
                            type: "Age",
                            value: "50+",
                        },
                        {
                            type: "Gender",
                            value: "Female",
                        },
                    ],
                },
                {
                    uid: "user2",
                    demographics: [
                        {
                            type: "State",
                            value: "VIC",
                        },
                        {
                            type: "Age",
                            value: "50+",
                        },
                        {
                            type: "Gender",
                            value: "Male",
                        },
                    ],
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
