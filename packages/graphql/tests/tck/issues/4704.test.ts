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

describe("https://github.com/neo4j/graphql/issues/4704", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Show @node {
                title: String!
                cost: Float
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show @node {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "STARRED_IN", direction: IN, properties: "StarredIn")
            }

            type Actor @node {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }

            type StarredIn @relationshipProperties {
                episodes: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {},
        });
    });

    test("Connection ALL operator should be true for all the shows implementations", async () => {
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        actedInConnection_ALL: { node: { actorsConnection_ALL: { node: { name_EQ: "Keanu Reeves" } } } }
                    }
                ) {
                    actedIn {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE ((EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE (EXISTS {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE this3.name = $param0
                } AND NOT (EXISTS {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE NOT (this3.name = $param0)
                }))
            } AND NOT (EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE NOT (EXISTS {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE this3.name = $param0
                } AND NOT (EXISTS {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE NOT (this3.name = $param0)
                }))
            })) AND (EXISTS {
                MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE (EXISTS {
                    MATCH (this5)<-[this6:STARRED_IN]-(this7:Actor)
                    WHERE this7.name = $param1
                } AND NOT (EXISTS {
                    MATCH (this5)<-[this6:STARRED_IN]-(this7:Actor)
                    WHERE NOT (this7.name = $param1)
                }))
            } AND NOT (EXISTS {
                MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE NOT (EXISTS {
                    MATCH (this5)<-[this6:STARRED_IN]-(this7:Actor)
                    WHERE this7.name = $param1
                } AND NOT (EXISTS {
                    MATCH (this5)<-[this6:STARRED_IN]-(this7:Actor)
                    WHERE NOT (this7.name = $param1)
                }))
            })))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this8:ACTED_IN]->(this9:Movie)
                    WITH this9 { .title, __resolveType: \\"Movie\\", __id: id(this9) } AS this9
                    RETURN this9 AS var10
                    UNION
                    WITH *
                    MATCH (this)-[this11:ACTED_IN]->(this12:Series)
                    WITH this12 { .title, __resolveType: \\"Series\\", __id: id(this12) } AS this12
                    RETURN this12 AS var10
                }
                WITH var10
                RETURN collect(var10) AS var10
            }
            RETURN this { actedIn: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Connection SINGLE operator should be true exactly for one shows implementations", async () => {
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        actedInConnection_SINGLE: {
                            node: { actorsConnection_SINGLE: { node: { name_EQ: "Keanu Reeves" } } }
                        }
                    }
                ) {
                    actedIn {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE (single(this1 IN [(this)-[this3:ACTED_IN]->(this1:Movie) WHERE single(this0 IN [(this1)<-[this2:ACTED_IN]-(this0:Actor) WHERE this0.name = $param0 | 1] WHERE true) | 1] WHERE true) XOR single(this5 IN [(this)-[this7:ACTED_IN]->(this5:Series) WHERE single(this4 IN [(this5)<-[this6:STARRED_IN]-(this4:Actor) WHERE this4.name = $param1 | 1] WHERE true) | 1] WHERE true))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this8:ACTED_IN]->(this9:Movie)
                    WITH this9 { .title, __resolveType: \\"Movie\\", __id: id(this9) } AS this9
                    RETURN this9 AS var10
                    UNION
                    WITH *
                    MATCH (this)-[this11:ACTED_IN]->(this12:Series)
                    WITH this12 { .title, __resolveType: \\"Series\\", __id: id(this12) } AS this12
                    RETURN this12 AS var10
                }
                WITH var10
                RETURN collect(var10) AS var10
            }
            RETURN this { actedIn: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Connection NONE operator should be true for all the shows implementations", async () => {
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        actedInConnection_NONE: { node: { actorsConnection_NONE: { node: { name_EQ: "Keanu Reeves" } } } }
                    }
                ) {
                    actedIn {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE (NOT (EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE NOT (EXISTS {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE this3.name = $param0
                })
            }) AND NOT (EXISTS {
                MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE NOT (EXISTS {
                    MATCH (this5)<-[this6:STARRED_IN]-(this7:Actor)
                    WHERE this7.name = $param1
                })
            }))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this8:ACTED_IN]->(this9:Movie)
                    WITH this9 { .title, __resolveType: \\"Movie\\", __id: id(this9) } AS this9
                    RETURN this9 AS var10
                    UNION
                    WITH *
                    MATCH (this)-[this11:ACTED_IN]->(this12:Series)
                    WITH this12 { .title, __resolveType: \\"Series\\", __id: id(this12) } AS this12
                    RETURN this12 AS var10
                }
                WITH var10
                RETURN collect(var10) AS var10
            }
            RETURN this { actedIn: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });
});
