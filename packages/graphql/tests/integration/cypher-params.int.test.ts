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
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("cypherParams", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should inject cypherParams on top-level cypher query", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
            }

            type Query {
                id: String! @cypher(statement: "RETURN $id AS id", columnName: "id")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const source = `
            {
                id
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            contextValue: { cypherParams: { id } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).id).toEqual(id);
    });

    test("should inject cypherParams on field level nested query", async () => {
        const typeDefs = `
            type CypherParams {
                id: ID
            }

            type ${Movie} {
              id: ID
              cypherParams: CypherParams @cypher(statement: "RETURN $cypherParams AS result", columnName: "result")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const movieId = generate({
            charset: "alphabetic",
        });
        const cypherParamsId = generate({
            charset: "alphabetic",
        });

        const source = `
            query($id: ID) {
                ${Movie.plural}(where: {id: $id}) {
                    id
                    cypherParams {
                        id
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $movieId})
            `,
            { movieId }
        );

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: {
                id: movieId,
            },
            contextValue: { cypherParams: { cypherParams: { id: cypherParamsId } } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.plural][0]).toEqual({
            id: movieId,
            cypherParams: {
                id: cypherParamsId,
            },
        });
    });

    test("should inject cypherParams on top-level cypher mutation", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
            }

            type Mutation {
                id: String! @cypher(statement: "RETURN $id AS id", columnName:"id")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const source = `
            mutation {
                id
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source, {
            contextValue: { cypherParams: { id } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).id).toEqual(id);
    });
});
