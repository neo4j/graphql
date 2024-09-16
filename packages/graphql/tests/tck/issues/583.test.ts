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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/583", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Show {
                title: String
            }

            interface Awardable {
                awardsGiven: Int!
            }

            type Actor implements Awardable @node {
                name: String
                awardsGiven: Int!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie implements Show & Awardable @node {
                title: String
                awardsGiven: Int!
            }

            type Series implements Show & Awardable @node {
                title: String
                awardsGiven: Int!
            }

            type ShortFilm implements Show @node {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should resolve properties from common interface", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WITH this1 { .title, .awardsGiven, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WITH this4 { .title, .awardsGiven, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:ShortFilm)
                    WITH this6 { .title, __resolveType: \\"ShortFilm\\", __id: id(this6) } AS this6
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
