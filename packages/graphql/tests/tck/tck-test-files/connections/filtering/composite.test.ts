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

describe("Cypher -> Connections -> Filtering -> Composite", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                firstName: String!
                lastName: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Composite", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] }
                            edge: { AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }] }
                        }
                    ) {
                        edges {
                            screenTime
                            node {
                                firstName
                                lastName
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
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WHERE ((this_acted_in_relationship.screenTime > $this_actorsConnection.args.where.edge.AND[0].screenTime_GT) AND (this_acted_in_relationship.screenTime < $this_actorsConnection.args.where.edge.AND[1].screenTime_LT)) AND ((this_actor.firstName = $this_actorsConnection.args.where.node.AND[0].firstName) AND (this_actor.lastName = $this_actorsConnection.args.where.node.AND[1].lastName))
            WITH collect({ screenTime: this_acted_in_relationship.screenTime, node: { firstName: this_actor.firstName, lastName: this_actor.lastName } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actorsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"AND\\": [
                                    {
                                        \\"screenTime_GT\\": {
                                            \\"low\\": 30,
                                            \\"high\\": 0
                                        }
                                    },
                                    {
                                        \\"screenTime_LT\\": {
                                            \\"low\\": 90,
                                            \\"high\\": 0
                                        }
                                    }
                                ]
                            },
                            \\"node\\": {
                                \\"AND\\": [
                                    {
                                        \\"firstName\\": \\"Tom\\"
                                    },
                                    {
                                        \\"lastName\\": \\"Hanks\\"
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"this_title\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
