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

describe("https://github.com/neo4j/graphql/issues/832", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Entity {
                id: String!
            }

            type Person implements Entity @node {
                id: String!
                name: String!
            }

            type Place implements Entity @node {
                id: String!
                location: Point!
            }

            type Interaction @node {
                id: ID! @id
                kind: String!
                subjects: [Entity!]! @relationship(type: "ACTED_IN", direction: IN)
                objects: [Entity!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should produce Cypher which doesn't create duplicate nodes, only selecting created nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id: { in: ["cain"] } } } } }
                        }
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id: { in: ["abel"] } } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Interaction)
                SET
                    this0.id = randomUUID(),
                    this0.kind = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Person)
                    WHERE this1.id IN $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Place)
                    WHERE this3.id IN $param2
                    CREATE (this0)<-[this4:ACTED_IN]-(this3)
                }
                WITH *
                CALL (this0) {
                    MATCH (this5:Person)
                    WHERE this5.id IN $param3
                    CREATE (this0)-[this6:ACTED_IN]->(this5)
                }
                WITH *
                CALL (this0) {
                    MATCH (this7:Place)
                    WHERE this7.id IN $param4
                    CREATE (this0)-[this8:ACTED_IN]->(this7)
                }
                RETURN this0 AS this
                UNION
                CREATE (this9:Interaction)
                SET
                    this9.id = randomUUID(),
                    this9.kind = $param5
                WITH *
                CALL (this9) {
                    MATCH (this10:Person)
                    WHERE this10.id IN $param6
                    CREATE (this9)<-[this11:ACTED_IN]-(this10)
                }
                WITH *
                CALL (this9) {
                    MATCH (this12:Place)
                    WHERE this12.id IN $param7
                    CREATE (this9)<-[this13:ACTED_IN]-(this12)
                }
                WITH *
                CALL (this9) {
                    MATCH (this14:Person)
                    WHERE this14.id IN $param8
                    CREATE (this9)-[this15:ACTED_IN]->(this14)
                }
                WITH *
                CALL (this9) {
                    MATCH (this16:Place)
                    WHERE this16.id IN $param9
                    CREATE (this9)-[this17:ACTED_IN]->(this16)
                }
                RETURN this9 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var18
            }
            RETURN collect(var18) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"PARENT_OF\\",
                \\"param1\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param2\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param3\\": [
                    \\"cain\\"
                ],
                \\"param4\\": [
                    \\"cain\\"
                ],
                \\"param5\\": \\"PARENT_OF\\",
                \\"param6\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param7\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param8\\": [
                    \\"abel\\"
                ],
                \\"param9\\": [
                    \\"abel\\"
                ]
            }"
        `);
    });

    test("should produce Cypher correctly creates one interaction", async () => {
        const query = /* GraphQL */ `
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id: { in: ["cain"] } } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Interaction)
                SET
                    this0.id = randomUUID(),
                    this0.kind = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Person)
                    WHERE this1.id IN $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Place)
                    WHERE this3.id IN $param2
                    CREATE (this0)<-[this4:ACTED_IN]-(this3)
                }
                WITH *
                CALL (this0) {
                    MATCH (this5:Person)
                    WHERE this5.id IN $param3
                    CREATE (this0)-[this6:ACTED_IN]->(this5)
                }
                WITH *
                CALL (this0) {
                    MATCH (this7:Place)
                    WHERE this7.id IN $param4
                    CREATE (this0)-[this8:ACTED_IN]->(this7)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var9
            }
            RETURN collect(var9) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"PARENT_OF\\",
                \\"param1\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param2\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param3\\": [
                    \\"cain\\"
                ],
                \\"param4\\": [
                    \\"cain\\"
                ]
            }"
        `);
    });

    test("should produce Cypher correctly creates second interaction", async () => {
        const query = /* GraphQL */ `
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id: { in: ["abel"] } } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Interaction)
                SET
                    this0.id = randomUUID(),
                    this0.kind = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Person)
                    WHERE this1.id IN $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Place)
                    WHERE this3.id IN $param2
                    CREATE (this0)<-[this4:ACTED_IN]-(this3)
                }
                WITH *
                CALL (this0) {
                    MATCH (this5:Person)
                    WHERE this5.id IN $param3
                    CREATE (this0)-[this6:ACTED_IN]->(this5)
                }
                WITH *
                CALL (this0) {
                    MATCH (this7:Place)
                    WHERE this7.id IN $param4
                    CREATE (this0)-[this8:ACTED_IN]->(this7)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var9
            }
            RETURN collect(var9) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"PARENT_OF\\",
                \\"param1\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param2\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param3\\": [
                    \\"abel\\"
                ],
                \\"param4\\": [
                    \\"abel\\"
                ]
            }"
        `);
    });

    test("should produce Cypher which doesn't create duplicate nodes, selecting related nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id: { in: ["cain"] } } } } }
                        }
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                            objects: { connect: { where: { node: { id: { in: ["abel"] } } } } }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                        subjects {
                            id
                        }
                        objects {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Interaction)
                SET
                    this0.id = randomUUID(),
                    this0.kind = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Person)
                    WHERE this1.id IN $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Place)
                    WHERE this3.id IN $param2
                    CREATE (this0)<-[this4:ACTED_IN]-(this3)
                }
                WITH *
                CALL (this0) {
                    MATCH (this5:Person)
                    WHERE this5.id IN $param3
                    CREATE (this0)-[this6:ACTED_IN]->(this5)
                }
                WITH *
                CALL (this0) {
                    MATCH (this7:Place)
                    WHERE this7.id IN $param4
                    CREATE (this0)-[this8:ACTED_IN]->(this7)
                }
                RETURN this0 AS this
                UNION
                CREATE (this9:Interaction)
                SET
                    this9.id = randomUUID(),
                    this9.kind = $param5
                WITH *
                CALL (this9) {
                    MATCH (this10:Person)
                    WHERE this10.id IN $param6
                    CREATE (this9)<-[this11:ACTED_IN]-(this10)
                }
                WITH *
                CALL (this9) {
                    MATCH (this12:Place)
                    WHERE this12.id IN $param7
                    CREATE (this9)<-[this13:ACTED_IN]-(this12)
                }
                WITH *
                CALL (this9) {
                    MATCH (this14:Person)
                    WHERE this14.id IN $param8
                    CREATE (this9)-[this15:ACTED_IN]->(this14)
                }
                WITH *
                CALL (this9) {
                    MATCH (this16:Place)
                    WHERE this16.id IN $param9
                    CREATE (this9)-[this17:ACTED_IN]->(this16)
                }
                RETURN this9 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    CALL (*) {
                        WITH *
                        MATCH (this)<-[this18:ACTED_IN]-(this19:Person)
                        WITH this19 { .id, __resolveType: \\"Person\\", __id: id(this19) } AS var20
                        RETURN var20
                        UNION
                        WITH *
                        MATCH (this)<-[this21:ACTED_IN]-(this22:Place)
                        WITH this22 { .id, __resolveType: \\"Place\\", __id: id(this22) } AS var20
                        RETURN var20
                    }
                    WITH var20
                    RETURN collect(var20) AS var20
                }
                CALL (this) {
                    CALL (*) {
                        WITH *
                        MATCH (this)-[this23:ACTED_IN]->(this24:Person)
                        WITH this24 { .id, __resolveType: \\"Person\\", __id: id(this24) } AS var25
                        RETURN var25
                        UNION
                        WITH *
                        MATCH (this)-[this26:ACTED_IN]->(this27:Place)
                        WITH this27 { .id, __resolveType: \\"Place\\", __id: id(this27) } AS var25
                        RETURN var25
                    }
                    WITH var25
                    RETURN collect(var25) AS var25
                }
                RETURN this { .id, subjects: var20, objects: var25 } AS var28
            }
            RETURN collect(var28) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"PARENT_OF\\",
                \\"param1\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param2\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param3\\": [
                    \\"cain\\"
                ],
                \\"param4\\": [
                    \\"cain\\"
                ],
                \\"param5\\": \\"PARENT_OF\\",
                \\"param6\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param7\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param8\\": [
                    \\"abel\\"
                ],
                \\"param9\\": [
                    \\"abel\\"
                ]
            }"
        `);
    });

    test("simplest reproduction", async () => {
        const query = /* GraphQL */ `
            mutation {
                createInteractions(
                    input: [
                        {
                            subjects: { connect: { where: { node: { id: { in: ["adam", "eve"] } } } } }
                            kind: "PARENT_OF"
                        }
                        { kind: "PARENT_OF" }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                    interactions {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Interaction)
                SET
                    this0.id = randomUUID(),
                    this0.kind = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Person)
                    WHERE this1.id IN $param1
                    CREATE (this0)<-[this2:ACTED_IN]-(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Place)
                    WHERE this3.id IN $param2
                    CREATE (this0)<-[this4:ACTED_IN]-(this3)
                }
                RETURN this0 AS this
                UNION
                CREATE (this5:Interaction)
                SET
                    this5.id = randomUUID(),
                    this5.kind = $param3
                RETURN this5 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var6
            }
            RETURN collect(var6) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"PARENT_OF\\",
                \\"param1\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param2\\": [
                    \\"adam\\",
                    \\"eve\\"
                ],
                \\"param3\\": \\"PARENT_OF\\"
            }"
        `);
    });
});
