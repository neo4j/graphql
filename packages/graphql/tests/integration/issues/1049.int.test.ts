/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1049", () => {
    const testHelper = new TestHelper();

    let Book: UniqueType;
    let Film: UniqueType;
    let Person: UniqueType;
    let Media: UniqueType;

    beforeAll(async () => {
        Book = testHelper.createUniqueType("Book");
        Film = testHelper.createUniqueType("Film");
        Person = testHelper.createUniqueType("Person");
        Media = testHelper.createUniqueType("Media");

        const typeDefs = `
            interface ${Media.name} {
                id: ID!
                title: String!
                likedBy: [${Person.name}!]! @declareRelationship
                similar: [${Media.name}!]!

            }

            type ${Book.name} implements ${Media.name} @node(labels: ["${Book.name}", "${Media.name}"]) {
                id: ID! @id
                title: String!
                likedBy: [${Person.name}!]! @relationship(type: "LIKES", direction: IN)
                similar: [${Media.name}!]! @cypher(
                    statement: """
                    MATCH (this)<-[:LIKES]-(:${Person.name})-[:LIKES]->(other:${Media.name})
                    RETURN COLLECT(other { .*, __resolveType: apoc.coll.subtract(labels(other), ['Meda'])[0] }) as x
                    """,
                    columnName: "x"
                )

                pageCount: Int!
            }

            type ${Film.name} implements ${Media.name} @node(labels: ["${Film.name}", "${Media.name}"]) {
                id: ID! @id
                title: String!
                likedBy: [${Person.name}!]! @relationship(type: "LIKES", direction: IN)
                similar: [${Media.name}!]! @cypher(
                    statement: """
                    MATCH (this)<-[:LIKES]-(:${Person.name})-[:LIKES]->(other:${Media.name})
                    RETURN COLLECT(other { .*, __resolveType: apoc.coll.subtract(labels(other), ['Meda'])[0] }) as x
                    """,
                    columnName: "x"
                )

                runTime: Int!
            }

            type ${Person.name} @node {
                name: String
                likes: [${Media.name}!]! @relationship(type: "LIKES", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("error should not be thrown", async () => {
        const mutation = `
            mutation {
                ${Person.operations.create}(
                    input: [
                        {
                            name: "Bob"
                            likes: {
                                create: [
                                    { node: { ${Book.name}: { title: "Harry Potter", pageCount: 300 } } }
                                    { node: { ${Book.name}: { title: "Lord of the Rings", pageCount: 400 } } }
                                ]
                            }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);
        expect(mutationResult.errors).toBeUndefined();

        const query = `
            query {
                ${Person.plural}(where: { likesConnection_SOME: { node: { title_EQ: "Harry Potter" } } }) {
                    name
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({ [Person.plural]: [{ name: "Bob" }] });
    });
});
