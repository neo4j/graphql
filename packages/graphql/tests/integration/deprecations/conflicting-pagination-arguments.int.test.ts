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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Conflicting Pagination arguments", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;
    const id1 = "A";
    const id2 = "B";
    const id3 = "C";

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        const typeDefs = /* GraphQL */ `
             type ${Actor} @node {
                 name: String
                 movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
             }
         
             type ${Movie} @node {
                 id: ID!
                 title: String!
                 actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
             }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `CREATE (:${Movie} { id: "${id1}" }), (:${Movie} { id: "${id2}" }), (:${Movie} { id: "${id3}" })`
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should raise an error when deprecated pagination options are used together with pagination arguments", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(sort: [{ id: DESC }], options: { sort: { id: DESC }}){
                    id
                }
            }
        `;
        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toEqual([
            new GraphQLError(
                "Ambiguous pagination found. The options argument is deprecated. Please use the sort, limit, and offset arguments directly on the field."
            ),
        ]);
    });
    test("should raise an error when deprecated pagination options are used together with pagination arguments on related fields", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}{ 
                    actors(sort: [{ name: DESC }], options: { sort: { name: DESC }}){
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toEqual([
            new GraphQLError(
                "Ambiguous pagination found. The options argument is deprecated. Please use the sort, limit, and offset arguments directly on the field."
            ),
        ]);
    });
});
