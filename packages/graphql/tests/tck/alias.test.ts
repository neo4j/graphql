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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Cypher Alias", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor {
                name: String!
            }

            type Movie {
                id: ID
                releaseDate: DateTime!
                location: Point!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                custom: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                        columnName: "m"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Alias", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    movieId: id
                    actors {
                        aliasActorsName: name
                    }
                    custom {
                        aliasCustomId: id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN m
                }
                WITH m AS this0
                WITH this0 { aliasCustomId: this0.id } AS this0
                RETURN collect(this0) AS var1
            }
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WITH this3 { aliasActorsName: this3.name } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { movieId: this.id, actors: var4, custom: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
