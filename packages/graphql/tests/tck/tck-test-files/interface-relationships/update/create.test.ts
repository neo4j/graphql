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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Interface Relationships - Update create", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Update create an interface relationship", async () => {
        const query = gql`
            mutation {
                updateActors(
                    create: {
                        actedIn: { edge: { screenTime: 90 }, node: { Movie: { title: "Example Film", runtime: 90 } } }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            ... on Movie {
                                runtime
                            }
                            ... on Series {
                                episodes
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
            "MATCH (this:Actor)
            CREATE (this_create_actedIn_Movie0_node_Movie:Movie)
            SET this_create_actedIn_Movie0_node_Movie.title = $this_create_actedIn_Movie0_node_Movie_title
            SET this_create_actedIn_Movie0_node_Movie.runtime = $this_create_actedIn_Movie0_node_Movie_runtime
            WITH this, this_create_actedIn_Movie0_node_Movie, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this_create_actedIn_Movie0_node_Movie), properties: this_create_actedIn_Movie0_node_Movie}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            MERGE (this)-[this_create_actedIn_Movie0_relationship:ACTED_IN]->(this_create_actedIn_Movie0_node_Movie)
            SET this_create_actedIn_Movie0_relationship.screenTime = $this_create_actedIn_Movie0_relationship_screenTime
            WITH this, mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Actor', toName: 'Movie', relationshipName: 'ACTED_IN', id: id(this_create_actedIn_Movie0_node_Movie), toID: id(this), relationshipID: id(this_create_actedIn_Movie0_relationship), properties: this_create_actedIn_Movie0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            CALL {
            WITH this, mutateMeta
            MATCH (this)-[:ACTED_IN]->(this_Movie:Movie)
            RETURN  { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } AS actedIn
            UNION
            WITH this, mutateMeta
            MATCH (this)-[:ACTED_IN]->(this_Series:Series)
            RETURN  { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } AS actedIn
            }
            RETURN mutateMeta, this { .name, actedIn: collect(actedIn) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_create_actedIn_Movie0_node_Movie_title\\": \\"Example Film\\",
                \\"this_create_actedIn_Movie0_node_Movie_runtime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_create_actedIn_Movie0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
