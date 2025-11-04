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

describe("Interface filtering operations", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Show {
                title: String!
                cost: Float
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "STARRED_IN", direction: IN, properties: "StarredIn")
            }

            type Actor {
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

    test("Logical operator filter (top level)", async () => {
        const query = /* GraphQL */ `
            query actedInWhere {
                shows(where: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE (this0.title = $param0 OR this0.title = $param1)
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Series)
                WHERE (this1.title = $param2 OR this1.title = $param3)
                WITH this1 { .title, __resolveType: \\"Series\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Office\\",
                \\"param1\\": \\"The Office 2\\",
                \\"param2\\": \\"The Office\\",
                \\"param3\\": \\"The Office 2\\"
            }"
        `);
    });

    test("Logical operator filter (nested field)", async () => {
        const query = /* GraphQL */ `
            query actedInWhere {
                actors {
                    actedIn(where: { OR: [{ title: "The Office" }, { title: "The Office 2" }] }) {
                        title
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
                    WHERE (this1.title = $param0 OR this1.title = $param1)
                    WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WHERE (this4.title = $param2 OR this4.title = $param3)
                    WITH this4 { .title, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Office\\",
                \\"param1\\": \\"The Office 2\\",
                \\"param2\\": \\"The Office\\",
                \\"param3\\": \\"The Office 2\\"
            }"
        `);
    });

    test("Relationship operator filter", async () => {
        const query = /* GraphQL */ `
            {
                shows(where: { actors_SOME: { name: "Keanu Reeves" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    WHERE this1.name = $param0
                }
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this2:Series)
                WHERE EXISTS {
                    MATCH (this2)<-[:STARRED_IN]-(this3:Actor)
                    WHERE this3.name = $param1
                }
                WITH this2 { .title, __resolveType: \\"Series\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Relationship operator filter + typename_IN", async () => {
        const query = /* GraphQL */ `
            {
                shows(where: { typename_IN: [Movie], actors_SOME: { name: "Keanu Reeves" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE (this0:Movie AND EXISTS {
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    WHERE this1.name = $param0
                })
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this2:Series)
                WHERE (this2:Movie AND EXISTS {
                    MATCH (this2)<-[:STARRED_IN]-(this3:Actor)
                    WHERE this3.name = $param1
                })
                WITH this2 { .title, __resolveType: \\"Series\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Relationship operator filter + typename_IN + logical", async () => {
        const query = /* GraphQL */ `
            {
                shows(where: { OR: [{ typename_IN: [Movie] }, { actors_SOME: { name: "Keanu Reeves" } }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE (this0:Movie OR EXISTS {
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    WHERE this1.name = $param0
                })
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this2:Series)
                WHERE (this2:Movie OR EXISTS {
                    MATCH (this2)<-[:STARRED_IN]-(this3:Actor)
                    WHERE this3.name = $param1
                })
                WITH this2 { .title, __resolveType: \\"Series\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Connection operator filter", async () => {
        const query = /* GraphQL */ `
            {
                shows(where: { actorsConnection_SOME: { node: { name: "Keanu Reeves" } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WHERE this2.name = $param0
                }
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this3:Series)
                WHERE EXISTS {
                    MATCH (this3)<-[this4:STARRED_IN]-(this5:Actor)
                    WHERE this5.name = $param1
                }
                WITH this3 { .title, __resolveType: \\"Series\\", __id: id(this3) } AS this3
                RETURN this3 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Connection operator filter + typename_IN", async () => {
        const query = /* GraphQL */ `
            {
                shows(where: { typename_IN: [Movie], actorsConnection_SOME: { node: { name: "Keanu Reeves" } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE (this0:Movie AND EXISTS {
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WHERE this2.name = $param0
                })
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this3:Series)
                WHERE (this3:Movie AND EXISTS {
                    MATCH (this3)<-[this4:STARRED_IN]-(this5:Actor)
                    WHERE this5.name = $param1
                })
                WITH this3 { .title, __resolveType: \\"Series\\", __id: id(this3) } AS this3
                RETURN this3 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Connection operator filter + typename_IN + logical", async () => {
        const query = /* GraphQL */ `
            {
                shows(
                    where: {
                        OR: [{ typename_IN: [Movie] }, { actorsConnection_SOME: { node: { name: "Keanu Reeves" } } }]
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE (this0:Movie OR EXISTS {
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WHERE this2.name = $param0
                })
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this3:Series)
                WHERE (this3:Movie OR EXISTS {
                    MATCH (this3)<-[this4:STARRED_IN]-(this5:Actor)
                    WHERE this5.name = $param1
                })
                WITH this3 { .title, __resolveType: \\"Series\\", __id: id(this3) } AS this3
                RETURN this3 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Connection operator edge filter", async () => {
        const query = /* GraphQL */ `
            {
                shows(where: { actorsConnection_SOME: { edge: { ActedIn: { screenTime: 100 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WHERE this1.screenTime = $param0
                }
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this3:Series)
                WITH this3 { .title, __resolveType: \\"Series\\", __id: id(this3) } AS this3
                RETURN this3 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Connection operator edge filter + node filter", async () => {
        const query = /* GraphQL */ `
            {
                shows(
                    where: {
                        actorsConnection_SOME: {
                            edge: { ActedIn: { screenTime: 100 } }
                            node: { name: "Keanu Reeves" }
                        }
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WHERE (this2.name = $param0 AND this1.screenTime = $param1)
                }
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this3:Series)
                WHERE EXISTS {
                    MATCH (this3)<-[this4:STARRED_IN]-(this5:Actor)
                    WHERE this5.name = $param2
                }
                WITH this3 { .title, __resolveType: \\"Series\\", __id: id(this3) } AS this3
                RETURN this3 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\",
                \\"param1\\": {
                    \\"low\\": 100,
                    \\"high\\": 0
                },
                \\"param2\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Connection operator node filter + logical", async () => {
        const query = /* GraphQL */ `
            {
                shows(
                    where: {
                        actorsConnection_SOME: {
                            OR: [{ node: { name: "Keanu Reeves" } }, { node: { name: "Keanu Reeves" } }]
                        }
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WHERE (this2.name = $param0 OR this2.name = $param1)
                }
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this3:Series)
                WHERE EXISTS {
                    MATCH (this3)<-[this4:STARRED_IN]-(this5:Actor)
                    WHERE (this5.name = $param2 OR this5.name = $param3)
                }
                WITH this3 { .title, __resolveType: \\"Series\\", __id: id(this3) } AS this3
                RETURN this3 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"Keanu Reeves\\",
                \\"param3\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Relationship operator filter + typename_IN + logical (nested field)", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedIn(
                        where: {
                            typename_IN: [Movie]
                            actorsConnection_SOME: {
                                OR: [{ node: { name: "Keanu Reeves" } }, { node: { name: "Keanu Reeves" } }]
                            }
                        }
                    ) {
                        title
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
                        WHERE (this1:Movie AND EXISTS {
                            MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                            WHERE (this3.name = $param0 OR this3.name = $param1)
                        })
                        WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                        RETURN this1 AS var4
                        UNION
                        WITH *
                        MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                        WHERE (this6:Movie AND EXISTS {
                            MATCH (this6)<-[this7:STARRED_IN]-(this8:Actor)
                            WHERE (this8.name = $param2 OR this8.name = $param3)
                        })
                        WITH this6 { .title, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                        RETURN this6 AS var4
                    }
                    WITH var4
                    RETURN collect(var4) AS var4
                }
                RETURN this { actedIn: var4 } AS this"
            `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\",
                    \\"param2\\": \\"Keanu Reeves\\",
                    \\"param3\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Connection operator filter + typename_IN + logical (nested field)", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedIn(
                        where: {
                            typename_IN: [Movie]
                            actorsConnection_SOME: {
                                OR: [{ node: { name: "Keanu Reeves" } }, { node: { name: "Keanu Reeves" } }]
                            }
                        }
                    ) {
                        title
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
                        WHERE (this1:Movie AND EXISTS {
                            MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                            WHERE (this3.name = $param0 OR this3.name = $param1)
                        })
                        WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                        RETURN this1 AS var4
                        UNION
                        WITH *
                        MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                        WHERE (this6:Movie AND EXISTS {
                            MATCH (this6)<-[this7:STARRED_IN]-(this8:Actor)
                            WHERE (this8.name = $param2 OR this8.name = $param3)
                        })
                        WITH this6 { .title, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                        RETURN this6 AS var4
                    }
                    WITH var4
                    RETURN collect(var4) AS var4
                }
                RETURN this { actedIn: var4 } AS this"
            `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"Keanu Reeves\\",
                    \\"param1\\": \\"Keanu Reeves\\",
                    \\"param2\\": \\"Keanu Reeves\\",
                    \\"param3\\": \\"Keanu Reeves\\"
                }"
            `);
    });

    test("Connection nested operator filter + typename_IN + logical (nested field)", async () => {
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        actedInConnection_SOME: {
                            node: {
                                typename_IN: [Movie]
                                actorsConnection_SOME: {
                                    OR: [{ node: { name: "Keanu Reeves" } }, { node: { name: "Keanu Reeves" } }]
                                }
                            }
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
            WHERE (EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WHERE (this1:Movie AND EXISTS {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    WHERE (this3.name = $param0 OR this3.name = $param1)
                })
            } OR EXISTS {
                MATCH (this)-[this4:ACTED_IN]->(this5:Series)
                WHERE (this5:Movie AND EXISTS {
                    MATCH (this5)<-[this6:STARRED_IN]-(this7:Actor)
                    WHERE (this7.name = $param2 OR this7.name = $param3)
                })
            })
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
                    \\"param1\\": \\"Keanu Reeves\\",
                    \\"param2\\": \\"Keanu Reeves\\",
                    \\"param3\\": \\"Keanu Reeves\\"
                }"
            `);
    });
});
