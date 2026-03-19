/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5143", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID! @id
            }

            type Video @node {
                id: ID! @id
                publisher: [User!]! @relationship(type: "PUBLISHER", direction: IN)
            }
            extend type Video
                @authorization(filter: [{ where: { node: { publisher: { all: { id: { eq: "$jwt.sub" } } } } } }])

            type Query {
                getAllVids: [Video]!
                    @cypher(
                        statement: """
                        MATCH (video:Video)
                        RETURN video
                        LIMIT 1
                        """
                        columnName: "video"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("should return filtered results according to authorization rul", async () => {
        const query = /* GraphQL */ `
            query videos {
                getAllVids {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            contextValues: {
                token,
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              MATCH (video:Video)
              RETURN video
              LIMIT 1
            }
            WITH video AS this0
            WITH *
            WHERE ($isAuthenticated = true AND (EXISTS {
              MATCH (this0)<-[:PUBLISHER]-(this1:User)
              WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
            } AND NOT (EXISTS {
              MATCH (this0)<-[:PUBLISHER]-(this1:User)
              WHERE NOT ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
            })))
            WITH this0 { .id } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"1\\"
                }
            }"
        `);
    });
});
