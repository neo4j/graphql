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
import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../../../neo4j";
import { Neo4jGraphQL } from "../../../../../src/classes";
import { UniqueType } from "../../../../utils/graphql-types";
import { createJwtRequest } from "../../../../utils/create-jwt-request";

describe(`Field Level Auth Where Requests`, () => {
    let neoSchema: Neo4jGraphQL;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");
    const typeDefs = `
    type ${typeMovie.name} {
        name: String
        year: Int
        createdAt: DateTime
        ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
    }

    type ${typeActor.name} {
        name: String
        year: Int
        createdAt: DateTime
        testId: Int
        ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
    }`;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = await neo4j.getSession();

        await session.run(`
            CREATE (m:${typeMovie.name}
                {name: "Terminator",year:1990,createdAt: datetime()})
                <-[:ACTED_IN]-
                (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime(), testId: 1234})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime(), testId: 1235})`);

        const extendedTypeDefs = `${typeDefs}
        extend type ${typeActor.name} @auth(rules: [{ where: { testId: "$jwt.sub" } }])`;

        neoSchema = new Neo4jGraphQL({
            typeDefs: extendedTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("authenticated query", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.plural}Aggregate {
                    count
                    }
                }
            }`;

        const req = createJwtRequest(secret, { sub: 1234 });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
            count: 1,
        });
    });

    test("unauthenticated query", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.plural}Aggregate {
                    count
                    }
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");
    });

    test("authenticated query with wrong credentials", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.plural}Aggregate {
                    count
                    }
                }
            }`;

        const invalidReq = createJwtRequest(secret, { sub: 2222 });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req: invalidReq }),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
            count: 0,
        });
    });
});
