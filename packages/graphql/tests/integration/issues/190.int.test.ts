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
import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/190", () => {
    let User: UniqueType;
    let UserDemographics: UniqueType;
    let typeDefs: DocumentNode;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        UserDemographics = testHelper.createUniqueType("UserDemographics");

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

        await testHelper.executeCypher(`
                    CREATE (user1:${User} {uid: 'user1'}),(user2:${User} {uid: 'user2'}),(female:${UserDemographics}{type:'Gender',value:'Female'}),(male:${UserDemographics}{type:'Gender',value:'Male'}),(age:${UserDemographics}{type:'Age',value:'50+'}),(state:${UserDemographics}{type:'State',value:'VIC'})
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(female)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(male)
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(age)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(age)
                    CREATE (user1)-[:HAS_DEMOGRAPHIC]->(state)
                    CREATE (user2)-[:HAS_DEMOGRAPHIC]->(state)
                `);
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Example 1", async () => {
        const query = /* GraphQL */ `
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

        const result = await testHelper.executeGraphQL(query);

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
    });

    test("Example 2", async () => {
        const query = /* GraphQL */ `
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

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)?.[User.plural]).toHaveLength(2);

        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics).toHaveLength(3);
        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics).toContainEqual({
            type: "Gender",
            value: "Female",
        });
        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics).toContainEqual({
            type: "State",
            value: "VIC",
        });
        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user1")[0].demographics).toContainEqual({
            type: "Age",
            value: "50+",
        });

        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics).toHaveLength(3);
        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics).toContainEqual({
            type: "Gender",
            value: "Male",
        });
        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics).toContainEqual({
            type: "State",
            value: "VIC",
        });
        expect((result?.data as any)?.[User.plural].filter((u) => u.uid === "user2")[0].demographics).toContainEqual({
            type: "Age",
            value: "50+",
        });
    });
});
