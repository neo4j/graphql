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

import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("Label cypher injection", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should escape the label name passed in context", async () => {
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node(labels: ["$context.label"]) {
                title: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `
        query {
            ${typeMovie.plural} {
                title
            }
        }
        `;

        const res = await testHelper.executeGraphQL(query, {
            contextValue: {
                label: "Movie\\u0060) MATCH",
            },
        });

        expect(res.errors).toBeUndefined();
    });

    test("should escape the label name passed through jwt", async () => {
        const typeMovie = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${typeMovie} @node(labels: ["$jwt.label"]) {
                title: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "1234",
                },
            },
        });

        const query = `
        query {
            ${typeMovie.plural} {
                title
            }
        }
        `;

        const token = createBearerToken("1234", { label: "Movie\\u0060) MATCH" });

        const res = await testHelper.executeGraphQLWithToken(query, token);

        expect(res.errors).toBeUndefined();
    });
});
