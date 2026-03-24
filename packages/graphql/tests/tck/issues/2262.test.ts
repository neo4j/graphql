/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2262", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Component @node {
                uuid: String
                upstreamProcess: [Process!]! @relationship(type: "OUTPUT", direction: IN)
                downstreamProcesses: [Process!]! @relationship(type: "INPUT", direction: OUT)
            }

            type Process @node {
                uuid: String
                componentOutputs: [Component!]! @relationship(type: "OUTPUT", direction: OUT)
                componentInputs: [Component!]! @relationship(type: "INPUT", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query nested relations under a root connection field", async () => {
        const query = /* GraphQL */ `
            query ComponentsProcesses {
                components(where: { uuid: { eq: "c1" } }) {
                    uuid
                    upstreamProcessConnection {
                        edges {
                            node {
                                uuid
                                componentInputsConnection(sort: [{ node: { uuid: DESC } }]) {
                                    edges {
                                        node {
                                            uuid
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Component)
            WHERE this.uuid = $param0
            CALL (this) {
              MATCH (this)<-[this0:OUTPUT]-(this1:Process)
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                CALL (this1) {
                  MATCH (this1)<-[this2:INPUT]-(this3:Component)
                  WITH collect({node: this3, relationship: this2}) AS edges
                  CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this3, edge.relationship AS this2
                    WITH *
                    ORDER BY this3.uuid DESC
                    RETURN collect({node: {uuid: this3.uuid, __resolveType: 'Component'}}) AS var4
                  }
                  RETURN {edges: var4} AS var5
                }
                RETURN collect({node: {uuid: this1.uuid, componentInputsConnection: var5, __resolveType: 'Process'}}) AS var6
              }
              RETURN {edges: var6} AS var7
            }
            RETURN this { .uuid, upstreamProcessConnection: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"c1\\"
            }"
        `);
    });
});
