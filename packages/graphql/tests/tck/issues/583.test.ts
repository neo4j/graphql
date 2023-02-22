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
            config: { enableRegex: true },
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
                    MATCH (this)-[this0:ACTED_IN]->(this_actedIn:\`Movie\`)
                    WITH this_actedIn { __resolveType: \\"Movie\\", .title, .awardsGiven, __id: id(this) } AS this_actedIn
                    RETURN this_actedIn AS this_actedIn
                    UNION
                    WITH *
                    MATCH (this)-[this1:ACTED_IN]->(this_actedIn:\`Series\`)
                    WITH this_actedIn { __resolveType: \\"Series\\", .title, .awardsGiven, __id: id(this) } AS this_actedIn
                    RETURN this_actedIn AS this_actedIn
                    UNION
                    WITH *
                    MATCH (this)-[this2:ACTED_IN]->(this_actedIn:\`ShortFilm\`)
                    WITH this_actedIn { __resolveType: \\"ShortFilm\\", .title, __id: id(this) } AS this_actedIn
                    RETURN this_actedIn AS this_actedIn
                }
                WITH this_actedIn
                RETURN collect(this_actedIn) AS this_actedIn
            }
            RETURN this { .name, actedIn: this_actedIn } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
