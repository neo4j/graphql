/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Disable escaping", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Production: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Production = testHelper.createUniqueType("Production");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String!
            }

            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "FROM_PRODUCTION]->(:${Production})-[:ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.executeCypher(
            `
        CREATE (:${Movie} {title: "Matrix"})-[:FROM_PRODUCTION]->(:${Production})-[:ACTED_IN]->(:${Actor} {name: "Keanu"})
        `
        );
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                unsafeEscapeOptions: {
                    disableRelationshipTypeEscaping: true,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should match with unescaped type in relationship", async () => {
        const query = `
            query {
                ${Movie.plural} {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "Matrix",
                    actors: [
                        {
                            name: "Keanu",
                        },
                    ],
                },
            ],
        });
    });
});
