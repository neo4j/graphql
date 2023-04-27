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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#583", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Show {
                title: String
            }

            interface Awardable {
                awardsGiven: Int!
            }

            type Actor implements Awardable {
                name: String
                awardsGiven: Int!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie implements Show & Awardable {
                title: String
                awardsGiven: Int!
            }

            type Series implements Show & Awardable {
                title: String
                awardsGiven: Int!
            }

            type ShortFilm implements Show {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should replicate issue and return correct cypher", async () => {
        const query = gql`
            query shows {
                actors {
                    name
                    __typename
                    actedIn {
                        title
                        ... on Awardable {
                            awardsGiven
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:\`ACTED_IN\`]->(this1:\`Movie\`)
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .title, .awardsGiven } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:\`ACTED_IN\`]->(this4:\`Series\`)
                    WITH this4 { __resolveType: \\"Series\\", __id: id(this), .title, .awardsGiven } AS this4
                    RETURN this4 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this5:\`ACTED_IN\`]->(this6:\`ShortFilm\`)
                    WITH this6 { __resolveType: \\"ShortFilm\\", __id: id(this), .title } AS this6
                    RETURN this6 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .name, actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
