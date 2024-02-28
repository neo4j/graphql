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

import type { GraphQLError } from "graphql";
import { graphql } from "graphql";
import { type Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4617", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;
    let Actor: UniqueType;
    let id: string;
    let actorName: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
        Post = new UniqueType("Post");
        Actor = new UniqueType("Actor");

        id = generate({
            charset: "alphabetic",
        });
        actorName = generate({
            charset: "alphabetic",
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
                `   CREATE (:${Post.name} {title: "Post 1"})
                    CREATE (:${User.name} {id: $id, email: randomUUID()})
                    CREATE (:${Actor.name} {id: $id, email: randomUUID(), name: $actorName })
                `,
                { id, actorName }
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodesUsingSession(session, [User, Post]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("should not throw forbidden when user does have a correct allow on projection field", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [${User.name}!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [${User.name}!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });

    test("should not throw forbidden when user does have a correct allow on projection field (single target)", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: ${User.name} @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field (single target)", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: ${User.name} @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });

    test("should not throw forbidden when user does have a correct allow on projection field (interface target)", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            interface Person {
                id: ID
                email: String!
            }

            type ${User.name} implements Person {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            type ${Actor.name} implements Person {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field (interface target)", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            interface Person {
                id: ID
                email: String!
            }

            type ${User.name} implements Person {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            type ${Actor.name} implements Person {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        id
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });

    test("should not throw forbidden when user does have a correct allow on projection field (union target)", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            union Person = ${User.name} | ${Actor.name}

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            type ${Actor.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        ... on ${User.name} {
                            id
                            email
                        }
                        ... on ${Actor.name} {
                            id
                            email
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field (union target)", async () => {
        const typeDefs = `
            type ${Post.name} {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            union Person = ${User.name} | ${Actor.name}

            type ${User.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            type ${Actor.name} {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.sub" } } }])
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        ... on ${User.name} {
                            id
                            email
                        }
                        ... on ${Actor.name} {
                            id
                            email
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: { id },
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });
});
