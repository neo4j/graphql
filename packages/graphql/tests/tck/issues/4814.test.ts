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

describe("https://github.com/neo4j/graphql/issues/4814", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            interface Step {
                id: ID!
                nexts: [Step!]! @declareRelationship
                prevs: [Step!]! @declareRelationship
            }

            type AStep implements Step {
                id: ID! @id
                nexts: [Step!]! @relationship(type: "FOLLOWED_BY", direction: OUT)
                prevs: [Step!]! @relationship(type: "FOLLOWED_BY", direction: IN)
            }

            type BStep implements Step {
                id: ID! @id
                nexts: [Step!]! @relationship(type: "FOLLOWED_BY", direction: OUT)
                prevs: [Step!]! @relationship(type: "FOLLOWED_BY", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {},
        });
    });

    test("should use the direction specified in the typeDefs (direction: OUT, connection fields)", async () => {
        const query = /* GraphQL */ `
            query GetNextStep {
                steps(where: { id: "2" }) {
                    __typename
                    nextsConnection {
                        edges {
                            node {
                                id
                                __typename
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:AStep)
                WHERE this0.id = $param0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:FOLLOWED_BY]->(this2:AStep)
                        WITH { node: { __resolveType: \\"AStep\\", __id: id(this2), id: this2.id } } AS edge
                        RETURN edge
                        UNION
                        WITH this0
                        MATCH (this0)-[this3:FOLLOWED_BY]->(this4:BStep)
                        WITH { node: { __resolveType: \\"BStep\\", __id: id(this4), id: this4.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var5
                }
                WITH this0 { nextsConnection: var5, __resolveType: \\"AStep\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this6:BStep)
                WHERE this6.id = $param1
                CALL {
                    WITH this6
                    CALL {
                        WITH this6
                        MATCH (this6)-[this7:FOLLOWED_BY]->(this8:AStep)
                        WITH { node: { __resolveType: \\"AStep\\", __id: id(this8), id: this8.id } } AS edge
                        RETURN edge
                        UNION
                        WITH this6
                        MATCH (this6)-[this9:FOLLOWED_BY]->(this10:BStep)
                        WITH { node: { __resolveType: \\"BStep\\", __id: id(this10), id: this10.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var11
                }
                WITH this6 { nextsConnection: var11, __resolveType: \\"BStep\\", __id: id(this6) } AS this6
                RETURN this6 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });

    test("should use the direction specified in the typeDefs (direction: IN, connection fields)", async () => {
        const query = /* GraphQL */ `
            query GetNextStep {
                steps(where: { id: "2" }) {
                    __typename
                    prevsConnection {
                        edges {
                            node {
                                id
                                __typename
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:AStep)
                WHERE this0.id = $param0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:FOLLOWED_BY]-(this2:AStep)
                        WITH { node: { __resolveType: \\"AStep\\", __id: id(this2), id: this2.id } } AS edge
                        RETURN edge
                        UNION
                        WITH this0
                        MATCH (this0)<-[this3:FOLLOWED_BY]-(this4:BStep)
                        WITH { node: { __resolveType: \\"BStep\\", __id: id(this4), id: this4.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var5
                }
                WITH this0 { prevsConnection: var5, __resolveType: \\"AStep\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this6:BStep)
                WHERE this6.id = $param1
                CALL {
                    WITH this6
                    CALL {
                        WITH this6
                        MATCH (this6)<-[this7:FOLLOWED_BY]-(this8:AStep)
                        WITH { node: { __resolveType: \\"AStep\\", __id: id(this8), id: this8.id } } AS edge
                        RETURN edge
                        UNION
                        WITH this6
                        MATCH (this6)<-[this9:FOLLOWED_BY]-(this10:BStep)
                        WITH { node: { __resolveType: \\"BStep\\", __id: id(this10), id: this10.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var11
                }
                WITH this6 { prevsConnection: var11, __resolveType: \\"BStep\\", __id: id(this6) } AS this6
                RETURN this6 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });

    test("should use the direction specified in the typeDefs (direction: OUT, relationship fields)", async () => {
        const query = /* GraphQL */ `
            query GetNextStep {
                steps(where: { id: "2" }) {
                    __typename
                    nexts {
                        id
                        __typename
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:AStep)
                WHERE this0.id = $param0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)-[this1:FOLLOWED_BY]->(this2:AStep)
                        WITH this2 { .id, __resolveType: \\"AStep\\", __id: id(this2) } AS this2
                        RETURN this2 AS var3
                        UNION
                        WITH *
                        MATCH (this0)-[this4:FOLLOWED_BY]->(this5:BStep)
                        WITH this5 { .id, __resolveType: \\"BStep\\", __id: id(this5) } AS this5
                        RETURN this5 AS var3
                    }
                    WITH var3
                    RETURN collect(var3) AS var3
                }
                WITH this0 { nexts: var3, __resolveType: \\"AStep\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this6:BStep)
                WHERE this6.id = $param1
                CALL {
                    WITH this6
                    CALL {
                        WITH *
                        MATCH (this6)-[this7:FOLLOWED_BY]->(this8:AStep)
                        WITH this8 { .id, __resolveType: \\"AStep\\", __id: id(this8) } AS this8
                        RETURN this8 AS var9
                        UNION
                        WITH *
                        MATCH (this6)-[this10:FOLLOWED_BY]->(this11:BStep)
                        WITH this11 { .id, __resolveType: \\"BStep\\", __id: id(this11) } AS this11
                        RETURN this11 AS var9
                    }
                    WITH var9
                    RETURN collect(var9) AS var9
                }
                WITH this6 { nexts: var9, __resolveType: \\"BStep\\", __id: id(this6) } AS this6
                RETURN this6 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });

    test("should use the direction specified in the typeDefs (direction: IN, relationship fields)", async () => {
        const query = /* GraphQL */ `
            query GetNextStep {
                steps(where: { id: "2" }) {
                    __typename
                    prevs {
                        id
                        __typename
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:AStep)
                WHERE this0.id = $param0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)<-[this1:FOLLOWED_BY]-(this2:AStep)
                        WITH this2 { .id, __resolveType: \\"AStep\\", __id: id(this2) } AS this2
                        RETURN this2 AS var3
                        UNION
                        WITH *
                        MATCH (this0)<-[this4:FOLLOWED_BY]-(this5:BStep)
                        WITH this5 { .id, __resolveType: \\"BStep\\", __id: id(this5) } AS this5
                        RETURN this5 AS var3
                    }
                    WITH var3
                    RETURN collect(var3) AS var3
                }
                WITH this0 { prevs: var3, __resolveType: \\"AStep\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this6:BStep)
                WHERE this6.id = $param1
                CALL {
                    WITH this6
                    CALL {
                        WITH *
                        MATCH (this6)<-[this7:FOLLOWED_BY]-(this8:AStep)
                        WITH this8 { .id, __resolveType: \\"AStep\\", __id: id(this8) } AS this8
                        RETURN this8 AS var9
                        UNION
                        WITH *
                        MATCH (this6)<-[this10:FOLLOWED_BY]-(this11:BStep)
                        WITH this11 { .id, __resolveType: \\"BStep\\", __id: id(this11) } AS this11
                        RETURN this11 AS var9
                    }
                    WITH var9
                    RETURN collect(var9) AS var9
                }
                WITH this6 { prevs: var9, __resolveType: \\"BStep\\", __id: id(this6) } AS this6
                RETURN this6 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });
});
