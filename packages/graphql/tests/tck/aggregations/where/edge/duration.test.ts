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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with Duration", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                name: String
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                someDuration: Duration
                someDurationAlias: Duration @alias(property: "_someDurationAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_EQUAL: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someDuration = $aggr_edge_someDuration_EQUAL
            \\", { this: this, aggr_edge_someDuration_EQUAL: $aggr_edge_someDuration_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_EQUAL\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDurationAlias_EQUAL: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge._someDurationAlias = $aggr_edge_someDurationAlias_EQUAL
            \\", { this: this, aggr_edge_someDurationAlias_EQUAL: $aggr_edge_someDurationAlias_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDurationAlias_EQUAL\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_GT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someDuration > $aggr_edge_someDuration_GT
            \\", { this: this, aggr_edge_someDuration_GT: $aggr_edge_someDuration_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_GT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_GTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someDuration >= $aggr_edge_someDuration_GTE
            \\", { this: this, aggr_edge_someDuration_GTE: $aggr_edge_someDuration_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_GTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_LT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someDuration < $aggr_edge_someDuration_LT
            \\", { this: this, aggr_edge_someDuration_LT: $aggr_edge_someDuration_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_LT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_LTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someDuration <= $aggr_edge_someDuration_LTE
            \\", { this: this, aggr_edge_someDuration_LTE: $aggr_edge_someDuration_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_LTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("AVERAGE_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_EQUAL: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN avg(aggr_edge.someDuration) = $aggr_edge_someDuration_AVERAGE_EQUAL
            \\", { this: this, aggr_edge_someDuration_AVERAGE_EQUAL: $aggr_edge_someDuration_AVERAGE_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_AVERAGE_EQUAL\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_GT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN avg(aggr_edge.someDuration) > $aggr_edge_someDuration_AVERAGE_GT
            \\", { this: this, aggr_edge_someDuration_AVERAGE_GT: $aggr_edge_someDuration_AVERAGE_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_AVERAGE_GT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_GTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN avg(aggr_edge.someDuration) >= $aggr_edge_someDuration_AVERAGE_GTE
            \\", { this: this, aggr_edge_someDuration_AVERAGE_GTE: $aggr_edge_someDuration_AVERAGE_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_AVERAGE_GTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_LT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN avg(aggr_edge.someDuration) < $aggr_edge_someDuration_AVERAGE_LT
            \\", { this: this, aggr_edge_someDuration_AVERAGE_LT: $aggr_edge_someDuration_AVERAGE_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_AVERAGE_LT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_AVERAGE_LTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN avg(aggr_edge.someDuration) <= $aggr_edge_someDuration_AVERAGE_LTE
            \\", { this: this, aggr_edge_someDuration_AVERAGE_LTE: $aggr_edge_someDuration_AVERAGE_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_AVERAGE_LTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MIN_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MIN_EQUAL: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someDuration) = $aggr_edge_someDuration_MIN_EQUAL
            \\", { this: this, aggr_edge_someDuration_MIN_EQUAL: $aggr_edge_someDuration_MIN_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MIN_EQUAL\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MIN_GT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someDuration) > $aggr_edge_someDuration_MIN_GT
            \\", { this: this, aggr_edge_someDuration_MIN_GT: $aggr_edge_someDuration_MIN_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MIN_GT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MIN_GTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someDuration) >= $aggr_edge_someDuration_MIN_GTE
            \\", { this: this, aggr_edge_someDuration_MIN_GTE: $aggr_edge_someDuration_MIN_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MIN_GTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MIN_LT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someDuration) < $aggr_edge_someDuration_MIN_LT
            \\", { this: this, aggr_edge_someDuration_MIN_LT: $aggr_edge_someDuration_MIN_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MIN_LT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MIN_LTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someDuration) <= $aggr_edge_someDuration_MIN_LTE
            \\", { this: this, aggr_edge_someDuration_MIN_LTE: $aggr_edge_someDuration_MIN_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MIN_LTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MAX_EQUAL: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someDuration) = $aggr_edge_someDuration_MAX_EQUAL
            \\", { this: this, aggr_edge_someDuration_MAX_EQUAL: $aggr_edge_someDuration_MAX_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MAX_EQUAL\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MAX_GT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someDuration) > $aggr_edge_someDuration_MAX_GT
            \\", { this: this, aggr_edge_someDuration_MAX_GT: $aggr_edge_someDuration_MAX_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MAX_GT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MAX_GTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someDuration) >= $aggr_edge_someDuration_MAX_GTE
            \\", { this: this, aggr_edge_someDuration_MAX_GTE: $aggr_edge_someDuration_MAX_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MAX_GTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MAX_LT: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someDuration) < $aggr_edge_someDuration_MAX_LT
            \\", { this: this, aggr_edge_someDuration_MAX_LT: $aggr_edge_someDuration_MAX_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MAX_LT\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someDuration_MAX_LTE: "P1Y" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someDuration) <= $aggr_edge_someDuration_MAX_LTE
            \\", { this: this, aggr_edge_someDuration_MAX_LTE: $aggr_edge_someDuration_MAX_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someDuration_MAX_LTE\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });
});
