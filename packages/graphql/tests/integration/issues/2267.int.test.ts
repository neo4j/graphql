/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2267", () => {
    const testHelper = new TestHelper();

    let Place: UniqueType;
    let Post: UniqueType;
    let Story: UniqueType;

    beforeEach(async () => {
        Place = testHelper.createUniqueType("Place");
        Post = testHelper.createUniqueType("Post");
        Story = testHelper.createUniqueType("Story");

        const typeDefs = `
            type ${Place} @node {
                displayName: String!
                activity: [Publication!]! @relationship(type: "ACTIVITY", direction: IN)
            }

            interface Publication {
                name: String
                activity: [${Place}!]! @declareRelationship
            }

            type ${Post} implements Publication @node {
                name: String
                activity: [${Place}!]! @relationship(type: "ACTIVITY", direction: OUT)
            }

            type ${Story} implements Publication @node {
                name: String
                activity: [${Place}!]! @relationship(type: "ACTIVITY", direction: OUT)
            }
        `;

        await testHelper.executeCypher(`
        CREATE(:${Place} {displayName: "786 aa"})<-[:ACTIVITY]-(:${Post} {name: "A post"})
        CREATE(:${Place} {displayName: "8 à Huita"})
        CREATE(:${Place} {displayName: "9ème Sauvagea"})<-[:ACTIVITY]-(:${Story} {name: "A story"})
        CREATE(:${Place} {displayName: "A One Shopa"})
        CREATE(:${Place} {displayName: "zaza"})<-[:ACTIVITY]-(:${Post} {name: "Another post"})
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should correctly order when requesting only top-level fields", async () => {
        const query = /* GraphQL */ `
        query {
            ${Place.plural}(sort: { displayName: ASC }) {
              displayName
            }
          }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Place.plural]: [
                {
                    displayName: "786 aa",
                },
                {
                    displayName: "8 à Huita",
                },
                {
                    displayName: "9ème Sauvagea",
                },
                {
                    displayName: "A One Shopa",
                },
                {
                    displayName: "zaza",
                },
            ],
        });
    });

    test("should correctly order when requesting nested interface level fields", async () => {
        const query = /* GraphQL */ `
        query {
            ${Place.plural}(sort: { displayName: ASC }) {
              displayName
              activity{
                name
              }
            }
          }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Place.plural]: [
                {
                    displayName: "786 aa",
                    activity: [
                        {
                            name: "A post",
                        },
                    ],
                },
                {
                    displayName: "8 à Huita",
                    activity: [],
                },
                {
                    displayName: "9ème Sauvagea",
                    activity: [
                        {
                            name: "A story",
                        },
                    ],
                },
                {
                    displayName: "A One Shopa",
                    activity: [],
                },
                {
                    displayName: "zaza",
                    activity: [
                        {
                            name: "Another post",
                        },
                    ],
                },
            ],
        });
    });
});
