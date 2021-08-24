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

import { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { graphql } from "graphql";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("@alias directive", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type AliasDirectiveTestUser {
                name: String! @alias(property: "dbName")
                likes: [AliasDirectiveTestMovie] @relationship(direction: OUT, type: "LIKES", properties: "AliasDirectiveTestLikesProps")
            }

            type AliasDirectiveTestMovie {
                title: String! @alias(property: "dbTitle")
                year: Int
            }

            interface AliasDirectiveTestLikesProps {
                comment: String! @alias(property: "dbComment")
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    beforeEach(async () => {
        session = driver.session();
        await session.run(`MATCH (n:AliasDirectiveTestUser)-[]-(m:AliasDirectiveTestMovie) DETACH DELETE n, m`);
    });

    afterEach(async () => {
        await session.run(`MATCH (n:AliasDirectiveTestUser)-[]-(m:AliasDirectiveTestMovie) DETACH DELETE n, m`);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Aliased fields on nodes through connections", async () => {
        const dbName = generate({ charset: "alphabetic" });
        const dbComment = generate({ charset: "alphabetic" });
        const dbTitle = generate({ charset: "alphabetic" });
        const year = 2015;

        await session.run(
            `CREATE (:AliasDirectiveTestUser {dbName: $dbName})-[:LIKES {dbComment: $dbComment}]->(:AliasDirectiveTestMovie {dbTitle: $dbTitle, year: $year})`,
            { dbName, dbComment, dbTitle, year }
        );

        const usersQuery = `
            query UsersLikesMovies {
                aliasDirectiveTestUsers {
                    name
                    likesConnection {
                        edges {
                            node {
                                title
                                year
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: usersQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).aliasDirectiveTestUsers[0]).toEqual({
            name: dbName,
            likesConnection: {
                edges: [
                    {
                        node: {
                            title: dbTitle,
                            year,
                        },
                    },
                ],
            },
        });
    });
});
