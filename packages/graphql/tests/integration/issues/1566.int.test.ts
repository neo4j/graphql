/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1566", () => {
    let testContent: UniqueType;
    let testProject: UniqueType;
    let testCommunity: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        testContent = testHelper.createUniqueType("Content");
        testProject = testHelper.createUniqueType("Project");
        testCommunity = testHelper.createUniqueType("Community");

        const typeDefs = `
            type ${testContent.name} @node {
                name: String!
            }

            type ${testProject.name} @node {
                name: String!
            }

            union FeedItem = ${testContent.name} | ${testProject.name}

            type ${testCommunity.name} @node {
                id: Int!
                feedItem: FeedItem
                    @cypher(
                        statement: """
                        Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag)
                        return pag
                        """
                        columnName: "pag"
                    )
                hasFeedItems(limit: Int = 10, page: Int = 0): [FeedItem!]!
                    @cypher(
                        statement: """
                        Match(this)-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES|:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]-(pag)
                           return pag SKIP ($limit * $page) LIMIT $limit
                        """
                        columnName: "pag"
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("single value is returned for custom Cypher field of Union type", async () => {
        const query = `
            query {
                ${testCommunity.plural}(where: { id_EQ: 111111 }) {
                    id
                    feedItem {
                        __typename
                        ... on ${testContent.name} {
                            name
                        }
                        ... on ${testProject.name} {
                            name
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (c:${testCommunity.name} { id: 111111 })-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES]->(:${testContent.name} { name: "content1" })
        `;

        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect((result.data as any)?.[testCommunity.plural]?.[0]).toEqual({
            id: 111111,
            feedItem: {
                __typename: testContent.name,
                name: "content1",
            },
        });
    });

    test("multiple values are returned for custom Cypher field of list of Union types", async () => {
        const query = `
            query {
                ${testCommunity.plural}(where: { id_EQ: 4656564 }) {
                    id
                    hasFeedItems {
                        __typename
                        ... on ${testContent.name} {
                            name
                        }
                        ... on ${testProject.name} {
                            name
                        }
                    }
                }
            }
        `;

        const cypher = `
            CREATE (c:${testCommunity.name} { id: 4656564 })-[:COMMUNITY_CONTENTPIECE_HASCONTENTPIECES]->(:${testContent.name} { name: "content" })
            CREATE (c)-[:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]->(:${testProject.name} { name: "project1" })
            CREATE (c)-[:COMMUNITY_PROJECT_HASASSOCIATEDPROJECTS]->(:${testProject.name} { name: "project2" })
        `;

        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [testCommunity.plural]: [
                {
                    id: 4656564,
                    hasFeedItems: expect.toIncludeSameMembers([
                        {
                            __typename: testContent.name,
                            name: "content",
                        },
                        {
                            __typename: testProject.name,
                            name: "project1",
                        },
                        {
                            __typename: testProject.name,
                            name: "project2",
                        },
                    ]),
                },
            ],
        });
        expect((result.data as any)[testCommunity.plural][0].hasFeedItems).toHaveLength(3);
    });
});
