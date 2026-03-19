/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Operations", () => {
    let Person: UniqueType;
    const testHelper = new TestHelper();

    describe("Queries", () => {
        beforeEach(async () => {
            Person = testHelper.createUniqueType("Person");

            const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
                friends: [${Person}!]! @relationship(type: "HAS_FRIEND", direction: OUT, properties: "Friendship")
                acquaintances: [${Person}!]! @relationship(type: "KNOWS", direction: OUT, queryDirection: UNDIRECTED)
            }
            type Friendship @relationshipProperties {
                since: Int
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            // set-up for queries
            await testHelper.executeCypher(`
                CREATE (a:${Person} {name: "Alice"})
                CREATE (b:${Person} {name: "Bob"})
                MERGE (b)-[:KNOWS]->(a)
                MERGE (a)-[:HAS_FRIEND {since: 2020}]->(b)
            `);
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("Example 1. Get Person nodes with related nodes: friends applies only from Alice to Bob, while acquaintances applies both from Alice to Bob and from Bob to Alice", async () => {
            const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    name
                    friends {
                        name
                    }
                    acquaintances {
                        name
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.plural]: expect.toIncludeSameMembers([
                    {
                        name: "Alice",
                        friends: [{ name: "Bob" }],
                        acquaintances: [{ name: "Bob" }],
                    },
                    {
                        name: "Bob",
                        friends: [],
                        acquaintances: [{ name: "Alice" }],
                    },
                ]),
            });
        });
        test("Example 2. Directed relationship has to exist in each direction in order for the relationship to be traversable from both sides, while undirected relationship only has to exist in whichever direction", async () => {
            await testHelper.executeCypher(`
                MATCH (alice:${Person} {name: "Alice"})
                MATCH (bob:${Person} {name: "Bob"})
                MERGE (bob)-[:HAS_FRIEND]->(alice)
            `);
            const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    name
                    friends {
                        name
                    }
                    acquaintances {
                        name
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.plural]: expect.toIncludeSameMembers([
                    {
                        name: "Alice",
                        friends: [{ name: "Bob" }],
                        acquaintances: [{ name: "Bob" }],
                    },
                    {
                        name: "Bob",
                        friends: [{ name: "Alice" }],
                        acquaintances: [{ name: "Alice" }],
                    },
                ]),
            });
        });

        test("Example 3. Get Person nodes with related nodes through connection fields", async () => {
            await testHelper.executeCypher(`
                MATCH (alice:${Person} {name: "Alice"})
                MATCH (bob:${Person} {name: "Bob"})
                MERGE (bob)-[:HAS_FRIEND]->(alice)
            `);
            const query = /* GraphQL */ `
            query {
                ${Person.operations.connection} {
                    edges {
                        node {
                            name
                            friendsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    properties {
                                        since
                                    }
                                }
                            }
                            acquaintancesConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.connection]: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                name: "Alice",
                                friendsConnection: { edges: [{ node: { name: "Bob" }, properties: { since: 2020 } }] },
                                acquaintancesConnection: { edges: [{ node: { name: "Bob" } }] },
                            },
                        },
                        {
                            node: {
                                name: "Bob",
                                friendsConnection: {
                                    edges: [{ node: { name: "Alice" }, properties: { since: null } }],
                                },
                                acquaintancesConnection: { edges: [{ node: { name: "Alice" } }] },
                            },
                        },
                    ]),
                },
            });
        });
    });

    describe("Mutations", () => {
        beforeEach(async () => {
            Person = testHelper.createUniqueType("Person");

            const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
                friends: [${Person}!]! @relationship(type: "HAS_FRIEND", direction: OUT, properties: "Friendship")
                acquaintances: [${Person}!]! @relationship(type: "KNOWS", direction: OUT, queryDirection: UNDIRECTED)
            }
            type Friendship @relationshipProperties {
                since: Int
            }
        `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("Example 4. Top level create with nested connect and create operations", async () => {
            // setup
            await testHelper.executeCypher(`
                CREATE (b:${Person} {name: "Bob"})
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.create}(
                        input: [
                            {
                                name: "Charlie"
                                friends: { connect: { where: { node: { name: { eq: "Bob" } } } } }
                                acquaintances: { create: { node: { name: "Dave" } } }
                            }
                        ]
                    ) {
                        ${Person.plural} {
                            name
                            friends {
                                name
                            }
                            acquaintances {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.create]: {
                    [Person.plural]: expect.toIncludeSameMembers([
                        {
                            name: "Charlie",
                            friends: [{ name: "Bob" }],
                            acquaintances: [{ name: "Dave" }],
                        },
                    ]),
                },
            });

            await testHelper.expectRelationship(Person, Person, "HAS_FRIEND").toIncludeSameMembers([
                {
                    from: {
                        name: "Charlie",
                    },
                    to: {
                        name: "Bob",
                    },
                    relationship: {},
                },
            ]);
            await testHelper.expectRelationship(Person, Person, "KNOWS").toIncludeSameMembers([
                {
                    from: {
                        name: "Charlie",
                    },
                    to: {
                        name: "Dave",
                    },
                    relationship: {},
                },
            ]);
        });

        test("Example 5. Top level update with nested connect and create operations", async () => {
            await testHelper.executeCypher(`
                CREATE (b:${Person} {name: "Bob"})
                CREATE (c:${Person} {name: "Charlie"})
                CREATE (d:${Person} {name: "Dave"})
                MERGE (c)-[:HAS_FRIEND]->(b)
                MERGE (c)-[:KNOWS]->(d)
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(
                        where: { name: {eq: "Bob" } }
                        update: {
                            friends: {
                                connect: { where: { node: { name: { eq: "Charlie" } } } }
                                create: { node: { name:  "Camilla" } }
                            }
                            acquaintances: { connect: { where: { node: { name: { eq: "Dave" } } } } }
                        }
                    ) {
                        ${Person.plural} {
                            name
                            friends {
                                name
                            }
                            acquaintances {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: [
                        {
                            name: "Bob",
                            friends: expect.toIncludeSameMembers([{ name: "Charlie" }, { name: "Camilla" }]),
                            acquaintances: [{ name: "Dave" }],
                        },
                    ],
                },
            });

            await testHelper.expectRelationship(Person, Person, "HAS_FRIEND").toIncludeSameMembers([
                {
                    from: {
                        name: "Charlie",
                    },
                    to: {
                        name: "Bob",
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: "Bob",
                    },
                    to: {
                        name: "Charlie",
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: "Bob",
                    },
                    to: {
                        name: "Camilla",
                    },
                    relationship: {},
                },
            ]);
            await testHelper.expectRelationship(Person, Person, "KNOWS").toIncludeSameMembers([
                {
                    from: {
                        name: "Charlie",
                    },
                    to: {
                        name: "Dave",
                    },
                    relationship: {},
                },
                {
                    from: {
                        name: "Bob",
                    },
                    to: {
                        name: "Dave",
                    },
                    relationship: {},
                },
            ]);
        });

        test("Example 6. Top level update with nested update operation", async () => {
            await testHelper.executeCypher(`
                CREATE (b:${Person} {name: "Bob"})
                CREATE (c:${Person} {name: "Camilla"})
                MERGE (b)-[:HAS_FRIEND]->(c)
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(
                        where: { name: { eq: "Bob" } }
                        update: {
                            name: { set: "Bob B" }
                            friends: [
                                {
                                    update: {
                                        where: { node: { name: { eq: "Camilla" } } }
                                        node: { name: { set: "Camilla B" } }
                                        edge: { since: { set: 2022 } }
                                    }
                                }
                            ]
                        }
                    ) {
                        info {
                            nodesCreated
                            relationshipsCreated
                        }
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        nodesCreated: 0,
                        relationshipsCreated: 0,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Person, "HAS_FRIEND").toIncludeSameMembers([
                {
                    from: {
                        name: "Bob B",
                    },
                    to: {
                        name: "Camilla B",
                    },
                    relationship: {
                        since: 2022,
                    },
                },
            ]);
        });

        test("Example 7. Top level update with nested disconnect and delete operations", async () => {
            await testHelper.executeCypher(`
                CREATE (a:${Person} {name: "Alice"})
                CREATE (b:${Person} {name: "Bob B"})
                CREATE (c:${Person} {name: "Charlie"})
                MERGE (b)-[:HAS_FRIEND]->(a)
                MERGE (b)-[:HAS_FRIEND]->(c)
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(
                        where: { name: { eq: "Bob B" } }
                        update: {
                            friends: [
                                {
                                    delete: [{ where: { node: { name: { eq: "Alice" } } } }]
                                }
                                {
                                    disconnect: [{ where: { node: { name: { eq: "Charlie" } } } }]
                                }
                            ]
                        }
                    ) {
                        info {
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.update]: {
                    info: {
                        nodesDeleted: 1,
                        relationshipsDeleted: 2,
                    },
                },
            });

            await testHelper.expectRelationship(Person, Person, "HAS_FRIEND").toNotExist();
            await testHelper.expectNode(Person).count(2);
        });

        test("Example 8. Top level delete with nested delete operation matching 0 relationships", async () => {
            await testHelper.executeCypher(`
                CREATE (b:${Person} {name: "Bob B"})
                CREATE (c:${Person} {name: "Camilla B"})
                MERGE (b)-[:HAS_FRIEND]->(c)
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.delete}(
                        where: { name: { eq: "Camilla B" } }
                        delete: {
                            friends: [
                                {
                                    where: { node: { name: { eq: "Bob B" } } }
                                }
                            ]
                        }
                    ) {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.delete]: {
                    nodesDeleted: 1,
                    relationshipsDeleted: 1,
                },
            });
        });

        test("Example 9. Top level delete with nested delete operation matching correct node", async () => {
            await testHelper.executeCypher(`
                CREATE (b:${Person} {name: "Bob B"})
                CREATE (c:${Person} {name: "Camilla B"})
                MERGE (b)-[:HAS_FRIEND]->(c)
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.delete}(
                        where: { name: { eq: "Bob B" } }
                        delete: {
                            friends: [
                                {
                                    where: { node: { name: { eq: "Camilla B" } } }
                                }
                            ]
                        }
                    ) {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.delete]: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 1,
                },
            });
        });

        test("Example 10. Top level delete with nested delete operation on an undirected relationship", async () => {
            await testHelper.executeCypher(`
                CREATE (b:${Person} {name: "Bob B"})
                CREATE (c:${Person} {name: "Camilla B"})
                MERGE (b)-[:KNOWS]->(c)
            `);

            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.delete}(
                        where: { name: { eq: "Camilla B" } }
                        delete: {
                            acquaintances: [
                                {
                                    where: { node: { name: { eq: "Bob B" } } }
                                }
                            ]
                        }
                    ) {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            `;

            const result = await testHelper.executeGraphQL(query);
            expect(result.errors).toBeUndefined();
            expect(result.data).toEqual({
                [Person.operations.delete]: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 1,
                },
            });
        });
    });
});
