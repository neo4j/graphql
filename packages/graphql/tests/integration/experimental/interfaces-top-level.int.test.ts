/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("Top-level interface query fields", () => {
    const secret = "the-secret";

    let schema: GraphQLSchema;
    let neo4j: Neo4jHelper;
    let driver: Driver;
    let typeDefs: string;

    const SomeNodeType = new UniqueType("SomeNode");
    const OtherNodeType = new UniqueType("OtherNode");
    const MyImplementationType = new UniqueType("MyImplementation");
    const MyOtherImplementationType = new UniqueType("MyOtherImplementation");

    async function graphqlQuery(query: string, token: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        typeDefs = `
            type ${SomeNodeType} implements MyOtherInterface & MyInterface {
                id: ID! @id @unique
                something: String
                somethingElse: String
                other: [${OtherNodeType}!]! @relationship(type: "HAS_OTHER_NODES", direction: OUT)
            }
            type ${OtherNodeType} {
                id: ID! @id @unique
                interfaceField: MyInterface! @relationship(type: "HAS_INTERFACE_NODES", direction: OUT)
            }
            interface MyInterface {
                id: ID!
            }
            interface MyOtherInterface implements MyInterface {
                id: ID! 
                something: String
            }

            type ${MyImplementationType} implements MyInterface {
                id: ID! @id @unique
            }

            type ${MyOtherImplementationType} implements MyInterface {
                id: ID! @id @unique
                someField: String
            }

            extend type ${SomeNodeType} @authentication

            extend type ${OtherNodeType} @authentication
        `;

        const session = await neo4j.getSession();

        try {
            await session.run(`
            CREATE(:${SomeNodeType} { id: "1", something:"somenode",somethingElse:"test"  })-[:HAS_OTHER_NODES]->(other:${OtherNodeType} { id: "2" })
            CREATE(s:${SomeNodeType} { id: "10", something:"someothernode",somethingElse:"othertest"  })
            MERGE (s)-[:HAS_OTHER_NODES]->(other)
            CREATE(other)-[:HAS_INTERFACE_NODES]->(:${MyImplementationType} { id: "3" })
            CREATE(:${MyOtherImplementationType} { id: "4", someField: "bla" })
        `);
        } finally {
            await session.close();
        }

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [
            SomeNodeType,
            OtherNodeType,
            MyImplementationType,
            MyOtherImplementationType,
        ]);
        await session.close();
        await driver.close();
    });

    test("should return results on top-level simple query on interface target to a relationship", async () => {
        const query = `
            query {
                myInterfaces {
                    id
                    ... on ${MyOtherImplementationType} {
                        someField
                    }
                    ... on MyOtherInterface {
                        something
                        ... on ${SomeNodeType} {
                            somethingElse
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await graphqlQuery(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            myInterfaces: expect.toIncludeSameMembers([
                {
                    id: "1",
                    something: "somenode",
                    somethingElse: "test",
                },
                {
                    id: "10",
                    something: "someothernode",
                    somethingElse: "othertest",
                },
                {
                    id: "3",
                },
                {
                    id: "4",
                    someField: "bla",
                },
            ]),
        });
    });
    test("should return results on top-level simple query on simple interface", async () => {
        const query = `
            query {
                myOtherInterfaces {
                    id
                    ... on ${SomeNodeType} {
                        id
                        other {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await graphqlQuery(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            myOtherInterfaces: expect.toIncludeSameMembers([
                {
                    id: "1",
                    other: [
                        {
                            id: "2",
                        },
                    ],
                },
                {
                    id: "10",
                    other: [
                        {
                            id: "2",
                        },
                    ],
                },
            ]),
        });
    });

    test("should return results on top-level simple query on simple interface sorted", async () => {
        const query = `
            query {
                myOtherInterfaces(options: {sort: [{ something: DESC }] }) {
                    id
                    ... on ${SomeNodeType} {
                        id
                        something
                        other {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await graphqlQuery(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            myOtherInterfaces: [
                {
                    id: "10",
                    something: "someothernode",
                    other: [
                        {
                            id: "2",
                        },
                    ],
                },
                {
                    id: "1",
                    something: "somenode",
                    other: [
                        {
                            id: "2",
                        },
                    ],
                },
            ],
        });
    });

    test("should return results on top-level simple query on simple interface sorted with limit", async () => {
        const query = `
            query {
                myOtherInterfaces(options: {sort: [{ something: DESC }], limit: 1 }) {
                    id
                    ... on ${SomeNodeType} {
                        id
                        something
                        other {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await graphqlQuery(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            myOtherInterfaces: [
                {
                    id: "10",
                    something: "someothernode",
                    other: [
                        {
                            id: "2",
                        },
                    ],
                },
            ],
        });
    });

    describe("add authorization", () => {
        beforeAll(async () => {
            typeDefs =
                typeDefs +
                `
            type JWT @jwt {
                roles: [String]
                groups: [String]
            }
            extend type ${SomeNodeType} @authorization(
                filter: [
                    {
                        operations: [READ]
                        where: { node: { something: "$jwt.jwtAllowedNamesExample" }, jwt: { roles_INCLUDES: "admin" } }
                    }
                ]
            ) 
            extend type ${MyImplementationType} @authorization(validate: [{ operations: [READ], where: { jwt: { groups_INCLUDES: "a" } } }])
            `;
            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
            schema = await neoGraphql.getSchema();
        });
        test("should return authorized results on top-level simple query on interface target to a relationship", async () => {
            const query = `
                query {
                    myInterfaces {
                        id
                        ... on ${MyOtherImplementationType} {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on ${SomeNodeType} {
                                somethingElse
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, {
                roles: ["admin"],
                groups: ["a"],
                jwtAllowedNamesExample: "somenode",
            });
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toBeUndefined();
            expect(queryResult.data).toEqual({
                myInterfaces: expect.toIncludeSameMembers([
                    {
                        id: "1",
                        something: "somenode",
                        somethingElse: "test",
                    },
                    {
                        id: "3",
                    },
                    {
                        id: "4",
                        someField: "bla",
                    },
                ]),
            });
        });

        test("should throw forbidden if jwt incorrect on top-level simple query on interface target to a relationship", async () => {
            const query = `
                query {
                    myInterfaces {
                        id
                        ... on ${MyOtherImplementationType} {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on ${SomeNodeType} {
                                somethingElse
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, { jwtAllowedNamesExample: "somenode" });
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors?.[0]?.message).toBe("Forbidden");
        });

        test("should return authorization filtered results if jwt incorrect on top-level simple query on simple interface", async () => {
            const query = `
                query {
                    myOtherInterfaces {
                        id
                        ... on ${SomeNodeType} {
                            id
                            other {
                                id
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, {});
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toBeUndefined();
            expect(queryResult.data).toEqual({
                myOtherInterfaces: [],
            });
        });

        test("should return all results if jwt correct on top-level simple query on simple interface", async () => {
            const query = `
                query {
                    myOtherInterfaces {
                        id
                        ... on ${SomeNodeType} {
                            id
                            other {
                                id
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, { roles: ["admin"], jwtAllowedNamesExample: "somenode" });
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toBeUndefined();
            expect(queryResult.data).toEqual({
                myOtherInterfaces: expect.toIncludeSameMembers([
                    {
                        id: "1",
                        other: [
                            {
                                id: "2",
                            },
                        ],
                    },
                ]),
            });
        });
    });

    describe("add limit directive", () => {
        beforeAll(async () => {
            typeDefs = typeDefs + `extend interface MyInterface @limit(default: 1, max: 3) `;
            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
            schema = await neoGraphql.getSchema();
        });

        test("Limit from directive on Interface", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces {
                        id
                        ... on ${MyOtherImplementationType.name} {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on ${SomeNodeType.name} {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, {
                roles: ["admin"],
                groups: ["a"],
                jwtAllowedNamesExample: "somenode",
            });
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toBeUndefined();
            expect(queryResult.data?.myInterfaces).toHaveLength(1);
        });

        test("Max limit from directive on Interface overwrites the limit argument", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces(options: { limit: 6 }) {
                        id
                        ... on ${MyOtherImplementationType.name} {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on ${SomeNodeType.name} {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, {
                roles: ["admin"],
                groups: ["a"],
                jwtAllowedNamesExample: "somenode",
            });
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toBeUndefined();
            expect(queryResult.data?.myInterfaces).toHaveLength(3);
        });

        test("Limit argument overwrites default if lower than max", async () => {
            const query = /* GraphQL */ `
                query {
                    myInterfaces(options: { limit: 2 }) {
                        id
                        ... on ${MyOtherImplementationType.name} {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on ${SomeNodeType.name} {
                                somethingElse
                                other {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, {
                roles: ["admin"],
                groups: ["a"],
                jwtAllowedNamesExample: "somenode",
            });
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toBeUndefined();
            expect(queryResult.data?.myInterfaces).toHaveLength(2);
        });
    });

    describe("add schema configuration", () => {
        beforeAll(async () => {
            typeDefs = typeDefs + `extend interface MyInterface @query(read: false)`;
            const neoGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });
            schema = await neoGraphql.getSchema();
        });
        test("should throw error on top-level simple query on interface target to a relationship", async () => {
            const query = `
                query {
                    myInterfaces {
                        id
                        ... on ${MyOtherImplementationType} {
                            someField
                        }
                        ... on MyOtherInterface {
                            something
                            ... on ${SomeNodeType} {
                                somethingElse
                            }
                        }
                    }
                }
            `;

            const token = createBearerToken(secret, {});
            const queryResult = await graphqlQuery(query, token);
            expect(queryResult.errors).toHaveLength(1);
            expect(queryResult.errors?.[0]).toHaveProperty(
                "message",
                'Cannot query field "myInterfaces" on type "Query". Did you mean "myOtherInterfaces"?'
            );
        });
    });
});
