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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("Label cypher injection", () => {
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should escape the label name passed in context", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node(label: "$context.label") {
                title: String
            }
        `;

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();

        const query = `
        query {
            ${typeMovie.plural} {
                title
            }
        }
        `;

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), {
                label: "Movie\\u0060) MATCH",
            }),
        });

        expect(res.errors).toBeUndefined();
    });

    test("should escape the label name passed through jwt", async () => {
        const typeMovie = new UniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node(label: "$jwt.label") {
                title: String
            }
        `;

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: { key: "1234" },
            },
        });
        schema = await neoGraphql.getSchema();

        const query = `
        query {
            ${typeMovie.plural} {
                title
            }
        }
        `;

        const req = createJwtRequest("1234", { label: "Movie\\u0060) MATCH" });

        const res = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
        });

        expect(res.errors).toBeUndefined();
    });
});
