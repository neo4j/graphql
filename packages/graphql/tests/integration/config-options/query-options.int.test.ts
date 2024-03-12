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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("query options", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;

    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Actor = new UniqueType("Actor");
        Movie = new UniqueType("Movie");
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("queries should work with runtime set to interpreted", async () => {
        const session = await neo4j.getSession();

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

        try {
            await neoSchema.checkNeo4jCompat();

            await session.run(
                `
              CREATE (:${Movie} {id: $id}), (:${Movie} {id: $id}), (:${Movie} {id: $id})
            `,
                { id }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValues({ cypherQueryOptions: { runtime: "interpreted" } }),
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.[Movie.plural]).toEqual([{ id }, { id }, { id }]);
        } finally {
            await session.close();
        }
    });
});
