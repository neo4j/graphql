/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5143", () => {
    let User: UniqueType;
    let Video: UniqueType;

    const secret = "secret";
    const testHelper = new TestHelper();

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Video = testHelper.createUniqueType("Video");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID! @id
            }

            type ${Video} @node {
                id: ID! @id
                publisher: [${User}!]! @relationship(type: "PUBLISHER", direction: IN)
            }
            extend type ${Video} @authorization(filter: [{ where: { node: { publisher_SOME: { id_EQ: "$jwt.sub" } } } }])

            type Query {
                getAllVids: [${Video}]!
                    @cypher(
                        statement: """
                        MATCH (video:${Video.name})
                        RETURN video
                        LIMIT 1
                        """
                        columnName: "video"
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return filtered results according to authorization rule", async () => {
        const query = /* GraphQL */ `
            query videos {
                getAllVids {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${Video} { id: "1" })<-[:PUBLISHER]-(:${User} { id: "1" })
        `);

        const token = createBearerToken(secret, { sub: "1" });
        const result = await testHelper.executeGraphQLWithToken(query, token);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            getAllVids: [{ id: "1" }],
        });
    });
});
