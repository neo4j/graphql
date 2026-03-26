/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("info", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
            }

            type Movie @node {
                id: ID
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should return info from a create mutation", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "title", actors: { create: [{ node: { name: "Keanu" } }] } }]) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
              CREATE (create_this1:Movie)
              SET create_this1.title = create_var0.title
              WITH create_this1, create_var0
              CALL (create_this1, create_var0) {
                UNWIND create_var0.actors.create AS create_var2
                CREATE (create_this3:Actor)
                SET create_this3.name = create_var2.node.name
                MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                RETURN collect(NULL) AS create_var5
              }
              RETURN create_this1
            }
            RETURN 'Query cannot conclude with CALL'"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"title\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"Keanu\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }"
        `);
    });
});
