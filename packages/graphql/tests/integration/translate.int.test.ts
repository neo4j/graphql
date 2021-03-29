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
import { Neo4jGraphQL } from "../../src/classes";
import translate from "../../src/translate/translate";
import { trimmer } from "../../src/utils";

describe("translate", () => {
    test("should use a custom resolver to translate the cypher", async () => {
        const typeDefs = `
            type Movie {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers: { Query: { movies: MoviesResolver } } });

        function MoviesResolver(_root, _args, context, resolveInfo) {
            context.neoSchema = neoSchema;

            const [cypher] = translate({ context, resolveInfo });

            if (
                trimmer(cypher) ===
                trimmer(`
                    MATCH (this:Movie)
                    RETURN this { .id } as this
                `)
            ) {
                throw new Error("cypher correct");
            } else {
                throw new Error("cypher incorrect");
            }
        }

        const query = `
            query {
                movies {
                    id
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver: {} },
        });

        expect((result.errors as any[])[0].message).toEqual("cypher correct");
    });
});
