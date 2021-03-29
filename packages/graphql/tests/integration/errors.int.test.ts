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

import { graphql, GraphQLError } from "graphql";
import { Neo4jGraphQL } from "../../src/classes";

describe("Errors", () => {
    test("An error should be thrown if no driver is supplied", async () => {
        const typeDefs = `
            type Movie {
              id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                movies {
                    id
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
        });

        expect(gqlResult.errors).toHaveLength(1);
        expect((gqlResult.errors as GraphQLError[])[0].message).toEqual(
            "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or passed as context.driver in each request."
        );
    });
});
