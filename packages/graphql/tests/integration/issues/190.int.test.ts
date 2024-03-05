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

import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/190", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let User: UniqueType;
    let UserDemographics: UniqueType;
    let typeDefs: DocumentNode;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();
        User = new UniqueType("User");
        UserDemographics = new UniqueType("UserDemographics");

        typeDefs = gql`
        type ${User} {
            client_id: String
            uid: String
            demographics: [${UserDemographics}!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: OUT)
        }

        type ${UserDemographics} {
            client_id: String
            type: String
            value: String
            users: [${User}!]! @relationship(type: "HAS_DEMOGRAPHIC", direction: IN)
        }
    `;

        try {
            await session.run(
                `
                    CREATE (user1:${User} {uid: 'user1'}),(user2:${User} {uid: 'user2'}),(female:${UserDemographics}{type:'Gender',value:'Female'}),(male:${UserDemographics}{type:'Gender',value:'Male'}),(age:${UserDemographics}{type:'Age',value:'50+'}),(state:${UserDemographics}{type:'State',value:'VIC'})
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(female)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(male)
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(age)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(age)
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(state)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(state)
                `
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(`MATCH (u:${User}) WHERE (u.uid = 'user1' OR u.uid = 'user2') DETACH DELETE u`);
            await session.run(
                `MATCH (ud:${UserDemographics}) WHERE ((ud.type = 'Gender' AND ud.value = 'Female') OR (ud.type = 'Gender' AND ud.value = 'Male') OR (ud.type = 'Age' AND ud.value = '50+') OR (ud.type = 'State' AND ud.value = 'VIC')) DELETE ud`
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Example 1", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${User.plural}(where: { demographics: { type: "Gender", value: "Female" } }) {
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();
            expect((result?.data as any)?.[User.plural][0].uid).toBe("user1");
            expect((result?.data as any)?.[User.plural][0].demographics).toHaveLength(3);
            expect((result?.data as any)?.[User.plural][0].demographics).toContainEqual({
                type: "Age",
                value: "50+",
            });
            expect((result?.data as any)?.[User.plural][0].demographics).toContainEqual({
                type: "Gender",
                value: "Female",
            });
            expect((result?.data as any)?.[User.plural][0].demographics).toContainEqual({
                type: "State",
                value: "VIC",
            });
        } finally {
            await session.close();
        }
    });

    test("Example 2", async () => {
        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                ${User.plural}(
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
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.[User.plural]).toHaveLength(2);

            expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics).toHaveLength(
                3
            );
            expect(
                (result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics
            ).toContainEqual({
                type: "Gender",
                value: "Female",
            });
            expect(
                (result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics
            ).toContainEqual({
                type: "State",
                value: "VIC",
            });
            expect(
                (result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics
            ).toContainEqual({
                type: "Age",
                value: "50+",
            });

            expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics).toHaveLength(
                3
            );
            expect(
                (result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics
            ).toContainEqual({
                type: "Gender",
                value: "Male",
            });
            expect(
                (result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics
            ).toContainEqual({
                type: "State",
                value: "VIC",
            });
            expect(
                (result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics
            ).toContainEqual({
                type: "Age",
                value: "50+",
            });
        } finally {
            await session.close();
        }
    });
});
