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
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Interface Relationships - Create connect", () => {
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

    test("Create connect to an interface relationship", async () => {
        const query = gql`
            mutation {
                createActors(
                    input: [
                        {
                            name: "Actor Name"
                            actedIn: {
                                connect: { edge: { screenTime: 90 }, where: { node: { title_STARTS_WITH: "The " } } }
                            }
                        }
                    ]
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
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Actor', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_actedIn_connect0_node:Movie)
            	WHERE this0_actedIn_connect0_node.title STARTS WITH $this0_actedIn_connect0_node_title_STARTS_WITH
            CALL apoc.do.when(this0_actedIn_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
            SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            RETURN this0, this0_actedIn_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Actor', relationshipName: 'ACTED_IN', toName: 'Movie', id: id(this0), relationshipID: id(this0_actedIn_connect0_relationship), toID: id(this0_actedIn_connect0_node), properties: this0_actedIn_connect0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_actedIn_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_actedIn_connect0_node:this0_actedIn_connect0_node, this0_actedIn_connect0_relationship_screenTime:$this0_actedIn_connect0_relationship_screenTime})
            YIELD value
            WITH this0, this0_actedIn_connect0_node, value.this0_actedIn_connect0_node_mutateMeta as this0_actedIn_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_actedIn_connect_mutateMeta = [], tmp2_this0_actedIn_connect_mutateMeta IN COLLECT(this0_actedIn_connect_mutateMeta) | tmp1_this0_actedIn_connect_mutateMeta + tmp2_this0_actedIn_connect_mutateMeta) as this0_actedIn_connect_mutateMeta
            UNION
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_actedIn_connect0_node:Series)
            	WHERE this0_actedIn_connect0_node.title STARTS WITH $this0_actedIn_connect0_node_title_STARTS_WITH
            CALL apoc.do.when(this0_actedIn_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[this0_actedIn_connect0_relationship:ACTED_IN]->(this0_actedIn_connect0_node)
            SET this0_actedIn_connect0_relationship.screenTime = $this0_actedIn_connect0_relationship_screenTime
            RETURN this0, this0_actedIn_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Actor', relationshipName: 'ACTED_IN', toName: 'Series', id: id(this0), relationshipID: id(this0_actedIn_connect0_relationship), toID: id(this0_actedIn_connect0_node), properties: this0_actedIn_connect0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_actedIn_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_actedIn_connect0_node:this0_actedIn_connect0_node, this0_actedIn_connect0_relationship_screenTime:$this0_actedIn_connect0_relationship_screenTime})
            YIELD value
            WITH this0, this0_actedIn_connect0_node, value.this0_actedIn_connect0_node_mutateMeta as this0_actedIn_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_actedIn_connect_mutateMeta = [], tmp2_this0_actedIn_connect_mutateMeta IN COLLECT(this0_actedIn_connect_mutateMeta) | tmp1_this0_actedIn_connect_mutateMeta + tmp2_this0_actedIn_connect_mutateMeta) as this0_actedIn_connect_mutateMeta
            }
            WITH this0, this0_mutateMeta + this0_actedIn_connect_mutateMeta as this0_mutateMeta
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            WITH this0, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            CALL {
            WITH this0, mutateMeta
            MATCH (this0)-[:ACTED_IN]->(this0_Movie:Movie)
            RETURN  { __resolveType: \\"Movie\\", runtime: this0_Movie.runtime, title: this0_Movie.title } AS actedIn
            UNION
            WITH this0, mutateMeta
            MATCH (this0)-[:ACTED_IN]->(this0_Series:Series)
            RETURN  { __resolveType: \\"Series\\", episodes: this0_Series.episodes, title: this0_Series.title } AS actedIn
            }
            RETURN mutateMeta, this0 { .name, actedIn: collect(actedIn) } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Actor Name\\",
                \\"this0_actedIn_connect0_node_title_STARTS_WITH\\": \\"The \\",
                \\"this0_actedIn_connect0_relationship_screenTime\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
