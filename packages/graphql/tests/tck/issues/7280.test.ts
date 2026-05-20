/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/7280", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Asset @node {
                id: String!
                versions: [AssetVersion!]!
                    @relationship(
                        type: "ASSET_HAS_ASSETVERSION"
                        direction: OUT
                        nestedOperations: [CREATE]
                        queryDirection: DIRECTED
                    )
            }

            type AssetVersion @node {
                id: String!
                derivatives: [AssetDerivative!]!
                    @relationship(
                        type: "ASSETVERSION_HAS_ASSETDERIVATIVE"
                        direction: OUT
                        nestedOperations: [CREATE]
                        queryDirection: DIRECTED
                    )
                thumbnail: [AssetDerivative!]!
                    @relationship(
                        type: "ASSETVERSION_HAS_THUMBNAIL_ASSETDERIVATIVE"
                        direction: OUT
                        nestedOperations: [CONNECT]
                        queryDirection: DIRECTED
                    )
            }

            type AssetDerivative @node {
                id: String!
                thumbnailOfVersion: [AssetVersion!]!
                    @relationship(
                        type: "ASSETVERSION_HAS_THUMBNAIL_ASSETDERIVATIVE"
                        direction: IN
                        nestedOperations: [CONNECT]
                        queryDirection: DIRECTED
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should create relationships to created nodes in nested creation of nodes", async () => {
        const query = /* GraphQL */ `
            mutation NestedCreateConnectsToCreatedAncestor {
                createAssets(
                    input: [
                        {
                            id: "a1"
                            versions: {
                                create: [
                                    {
                                        node: {
                                            id: "v1"
                                            derivatives: {
                                                create: [
                                                    {
                                                        node: {
                                                            id: "d1"
                                                            thumbnailOfVersion: {
                                                                connect: [{ where: { node: { id: { eq: "v1" } } } }]
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              CREATE (this0:Asset)
              SET this0.id = $param0
              WITH *
              CREATE (this1:AssetVersion)
              MERGE (this0)-[this2:ASSET_HAS_ASSETVERSION]->(this1)
              SET this1.id = $param1
              WITH *
              CREATE (this3:AssetDerivative)
              MERGE (this1)-[this4:ASSETVERSION_HAS_ASSETDERIVATIVE]->(this3)
              SET this3.id = $param2
              WITH *
              CALL (this3) {
                MATCH (this5:AssetVersion)
                WHERE this5.id = $param3
                CREATE (this3)<-[this6:ASSETVERSION_HAS_THUMBNAIL_ASSETDERIVATIVE]-(this5)
              }
              RETURN this0 AS this
            }
            FINISH"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a1\\",
                \\"param1\\": \\"v1\\",
                \\"param2\\": \\"d1\\",
                \\"param3\\": \\"v1\\"
            }"
        `);
    });
});
