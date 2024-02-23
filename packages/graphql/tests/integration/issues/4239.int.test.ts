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

import { type Driver } from "neo4j-driver";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import gql from "graphql-tag";
import { graphql } from "graphql";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/4239", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;
    const Movie = new UniqueType("Movie");
    const Person = new UniqueType("Person");
    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const typeDefs = gql`
                type ${Movie.name}
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { node: { directorConnection: { node: { id: "$jwt.sub" } } } } }
                    ]
                ) {
                title: String
                director: [${Person.name}!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type ${Person.name} {
                id: ID
            }
        `;
        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (m:${Movie.name} {title: "Matrix"})<-[:DIRECTED]-(p:${Person.name} {id: "SOME_ID"})`,
                {}
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [Movie.name]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("should return Matrix if the JWT.sub matches", async () => {
        const schema = await neo4jGraphql.getSchema();
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ jwt: { sub: "SOME_ID" } }),
        });
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Movie.plural]).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({ title: "Matrix" })])
        );
    });

    test("should return a Forbidden error if the JWT.sub do not matches", async () => {
        const schema = await neo4jGraphql.getSchema();
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ jwt: { sub: "SOME_WRONG_ID" } }),
        });
        expect((response.errors as any[])[0].message).toBe("Forbidden");
    });
});
