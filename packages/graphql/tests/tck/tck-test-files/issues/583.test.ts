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
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("#583", () => {
    const secret = "secret";
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
                actedIn: [Show!] @relationship(type: "ACTED_IN", direction: OUT)
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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Actor)
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
            RETURN  { __resolveType: \\"Movie\\", title: this_Movie.title, awardsGiven: this_Movie.awardsGiven } AS actedIn
            UNION
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_Series:Series)
            RETURN  { __resolveType: \\"Series\\", title: this_Series.title, awardsGiven: this_Series.awardsGiven } AS actedIn
            UNION
            WITH this
            MATCH (this)-[:ACTED_IN]->(this_ShortFilm:ShortFilm)
            RETURN  { __resolveType: \\"ShortFilm\\", title: this_ShortFilm.title } AS actedIn
            }
            RETURN this { .name, actedIn: collect(actedIn) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
