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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1182", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID! @id
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                id: ID! @id
                name: String!
                dob: DateTime!
                homeAddress: Point!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("DateTime and Point values get set as expected", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: {
                                connectOrCreate: {
                                    where: { node: { id: 1 } }
                                    onCreate: {
                                        node: {
                                            name: "Tom Hanks"
                                            dob: "1970-01-01T00:00:00.000Z"
                                            homeAddress: { longitude: 1, latitude: 2 }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.id = randomUUID()
            SET this0.title = $this0_title
            	WITH this0
            CALL {
            	WITH this0
            	MERGE (this0_actors_connectOrCreate_this1:\`Actor\` { id: $this0_actors_connectOrCreate_param0 })
            ON CREATE SET
                    this0_actors_connectOrCreate_this1.name = $this0_actors_connectOrCreate_param1,
            this0_actors_connectOrCreate_this1.homeAddress = $this0_actors_connectOrCreate_param2,
            this0_actors_connectOrCreate_this1.dob = $this0_actors_connectOrCreate_param3
            MERGE (this0_actors_connectOrCreate_this1)-[this0_actors_connectOrCreate_this0:\`ACTED_IN\`]->(this0)
            	RETURN COUNT(*)
            }
            RETURN this0
            }
            RETURN [
            this0 { .title }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Forrest Gump\\",
                \\"this0_actors_connectOrCreate_param0\\": \\"1\\",
                \\"this0_actors_connectOrCreate_param1\\": \\"Tom Hanks\\",
                \\"this0_actors_connectOrCreate_param2\\": {
                    \\"longitude\\": 1,
                    \\"latitude\\": 2
                },
                \\"this0_actors_connectOrCreate_param3\\": {
                    \\"year\\": 1970,
                    \\"month\\": 1,
                    \\"day\\": 1,
                    \\"hour\\": 0,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
