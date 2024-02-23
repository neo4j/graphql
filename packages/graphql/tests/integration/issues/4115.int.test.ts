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

import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4115", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let User: UniqueType;
    let Family: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        session = await neo4j.getSession();

        User = new UniqueType("User");
        Family = new UniqueType("Family");
        Person = new UniqueType("Person");

        const typeDefs = `
            type ${User} {
                id: ID! @unique
                roles: [String!]!
            }

            type ${Family} {
                id: ID! @id @unique
                members: [${Person}!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: ${User}! @relationship(type: "CREATOR_OF", direction: IN)
            }

            type ${Person}
                @authorization(
                    filter: [
                        {
                            where: {
                                AND: [
                                    { node: { creator: { id: "$jwt.uid" } } }
                                    { node: { family: { creator: { roles_INCLUDES: "plan:paid" } } } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id @unique
                creator: ${User}! @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                family: ${Family}! @relationship(type: "MEMBER_OF", direction: OUT)
            }

            type JWT @jwt {
                roles: [String!]!
            }

            extend schema @authentication
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await session.run(`
            CREATE (u:${User} { id:"user1"})
            CREATE (paid:${User} { id:"paid-user", roles: ["plan:paid"]})
            CREATE (f1:${Family} { id: "family1" })<-[:CREATOR_OF]-(u)
            CREATE (f2:${Family} { id: "family2" })<-[:CREATOR_OF]-(paid)

            CREATE (p1:${Person} {id: "person1"})
            CREATE (p2:${Person} {id: "person2"})

            CREATE (p1)<-[:CREATOR_OF]-(u)
            CREATE (p1)-[:MEMBER_OF]->(f1)

            CREATE (p2)<-[:CREATOR_OF]-(u)
            CREATE (p2)-[:MEMBER_OF]->(f2)
        `);
    });

    afterAll(async () => {
        await cleanNodesUsingSession(session, [User, Family, Person]);
        await session.close();
        await driver.close();
    });

    test("should return aggregation of families only created by paid user role", async () => {
        const query = /* GraphQL */ `
            query Family {
                ${Family.plural} {
                    id
                    membersAggregate {
                        count
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { uid: "user1" });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();
        expect((result.data as any)[Family.plural]).toIncludeSameMembers([
            {
                id: "family1",
                membersAggregate: {
                    count: 0,
                },
            },
            {
                id: "family2",
                membersAggregate: {
                    count: 1,
                },
            },
        ]);
    });

    test("should not return aggregation for users that have not created the person or it doesn't belong to a paid role family", async () => {
        const query = /* GraphQL */ `
            query Family {
                ${Family.plural} {
                    id
                    membersAggregate {
                        count
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { uid: "paid-user" });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();
        expect((result.data as any)[Family.plural]).toIncludeSameMembers([
            {
                id: "family1",
                membersAggregate: {
                    count: 0,
                },
            },
            {
                id: "family2",
                membersAggregate: {
                    count: 0,
                },
            },
        ]);
    });
});
