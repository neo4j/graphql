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

import { generate } from "randomstring";
import type { Neo4jGraphQL } from "../../../src";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("query options", () => {
    let neoSchema: Neo4jGraphQL;

    const testHelper = new TestHelper();

    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${Actor} {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
    
            type ${Movie} {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("queries should work with runtime set to interpreted", async () => {
        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                ${Movie.plural}(where: {id: $id}){
                    id
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        await testHelper.executeCypher(
            `
              CREATE (:${Movie} {id: $id}), (:${Movie} {id: $id}), (:${Movie} {id: $id})
            `,
            { id }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { id },
            contextValue: { cypherQueryOptions: { runtime: "interpreted" } },
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[Movie.plural]).toEqual([{ id }, { id }, { id }]);
    });
});
