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

import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5142", () => {
    const testHelper = new TestHelper();

    beforeAll(async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                test(fields: [[String!]]!): String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Query: {
                    test(_parent, args) {
                        return "Hello World " + args.fields;
                    },
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should allow for a matrix input", async () => {
        const query = /* GraphQL */ `
            query {
                test(fields: [["first"], ["second"]])
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            test: "Hello World first,second",
        });
    });
});
