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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("Relationship - Multiple", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Director {
                id: ID!
                name: String!
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type Actor {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Person = Director | Actor

            type Movie {
                id: ID!
                title: String!
                director: Director! @relationship(type: "DIRECTED", direction: IN)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                people: [Person!]! @relationship(type: "DIRECTED|ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Simple Read On Union Relationship With Multiple Types", async () => {
        const query = gql`
            {
                movies(where: { title: "River Runs Through It, A" }) {
                    title
                    people {
                        ... on Director {
                            name
                        }
                        ... on Actor {
                            name
                        }
                    }
                    peopleConnection {
                        totalCount
                        edges {
                            _type
                            node {
                                ... on Director {
                                    name
                                }
                                ... on Actor {
                                    name
                                }
                            }
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)<-[this_directed_acted_in_relationship:DIRECTED|ACTED_IN]-(this_Director:Director)
            WITH { _type: type(this_directed_acted_in_relationship), node: { __resolveType: \\"Director\\", name: this_Director.name } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)<-[this_directed_acted_in_relationship:DIRECTED|ACTED_IN]-(this_Actor:Actor)
            WITH { _type: type(this_directed_acted_in_relationship), node: { __resolveType: \\"Actor\\", name: this_Actor.name } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS peopleConnection
            }
            RETURN this { .title, people:  [this_people IN [(this)<-[:DIRECTED|ACTED_IN]-(this_people) WHERE (\\"Director\\" IN labels(this_people)) OR (\\"Actor\\" IN labels(this_people)) | head( [ this_people IN [this_people] WHERE (\\"Director\\" IN labels(this_people)) | this_people { __resolveType: \\"Director\\",  .name } ] + [ this_people IN [this_people] WHERE (\\"Actor\\" IN labels(this_people)) | this_people { __resolveType: \\"Actor\\",  .name } ] ) ] WHERE this_people IS NOT NULL] , peopleConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"River Runs Through It, A\\"
            }"
        `);
    });
});
