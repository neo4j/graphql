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
import gql from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { INVALID_REQUIRED_FIELD_ERROR } from "../../../src/schema/get-custom-resolver-meta";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("@customResolver directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    const user = {
        id: "An-ID",
        firstName: "someFirstName",
        lastName: "a second name!",
    };

    const testType = new UniqueType("User");
    const customResolverField = "fullName";

    const typeDefs = `
        type ${testType} {
            id: ID!
            firstName: String!
            lastName: String!
            ${customResolverField}: String @customResolver(requires: "firstName lastName")
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Scalar fields", () => {
        let schema: GraphQLSchema;

        const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

        const resolvers = {
            [testType.name]: { [customResolverField]: fullName },
        };

        beforeAll(async () => {
            const session = await neo4j.getSession();

            const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
            schema = await neoSchema.getSchema();

            await session.run(
                `
                CREATE (user:${testType.name}) SET user = $user
            `,
                { user }
            );
            await session.close();
        });

        afterAll(async () => {
            const session = await neo4j.getSession();
            await session.run(`MATCH (n:${testType}) DETACH DELETE n`);
            await session.close();
        });

        test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
            const source = `
                query ${testType.name}($userId: ID!) {
                    ${testType.plural}(where: { id: $userId }) {
                        id
                        firstName
                        lastName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[testType.plural][0]).toEqual({
                ...user,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver without required fields in selection set", async () => {
            const source = `
                query ${testType.name}($userId: ID!) {
                    ${testType.plural}(where: { id: $userId }) {
                        id
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[testType.plural][0]).toEqual({
                id: user.id,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver with required field(s) aliased in selection set", async () => {
            const source = `
                query ${testType.name}($userId: ID!) {
                    ${testType.plural}(where: { id: $userId }) {
                        id
                        f: firstName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[testType.plural][0]).toEqual({
                id: user.id,
                f: user.firstName,
                fullName: fullName(user),
            });
        });
    });
    describe("Cypher fields", () => {
        const typeDefs = `
            type ${testType.name} {
                id: ID!
                firstName: String! @cypher(statement: "RETURN '${user.firstName}' as x", columnName: "x")
                lastName: String! @cypher(statement: "RETURN '${user.lastName}' as x", columnName: "x")
                fullName: String @customResolver(requires: "firstName lastName")
            }
        `;

        const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

        const resolvers = {
            [testType.name]: { [customResolverField]: fullName },
        };

        let schema: GraphQLSchema;

        beforeAll(async () => {
            const session = await neo4j.getSession();

            const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
            schema = await neoSchema.getSchema();

            await session.run(
                `
                CREATE (user:${testType.name}) SET user.id = $userId
            `,
                { userId: user.id }
            );
            await session.close();
        });

        afterAll(async () => {
            const session = await neo4j.getSession();
            await session.run(`MATCH (n:${testType.name}) DETACH DELETE n`);
            await session.close();
        });

        test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
            const source = `
                query ${testType.name}($userId: ID!) {
                    ${testType.plural}(where: { id: $userId }) {
                        id
                        firstName
                        lastName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[testType.plural][0]).toEqual({
                ...user,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver without required fields in selection set", async () => {
            const source = `
                query ${testType.name}($userId: ID!) {
                    ${testType.plural}(where: { id: $userId }) {
                        id
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[testType.plural][0]).toEqual({
                id: user.id,
                fullName: fullName(user),
            });
        });

        test("resolves field with custom resolver with required field(s) aliased in selection set", async () => {
            const source = `
                query ${testType.name}($userId: ID!) {
                    ${testType.plural}(where: { id: $userId }) {
                        id
                        f: firstName
                        fullName
                    }
                }
            `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: neo4j.getContextValues(),
                variableValues: { userId: user.id },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any)[testType.plural][0]).toEqual({
                id: user.id,
                f: user.firstName,
                fullName: fullName(user),
            });
        });
    });

    describe("Custom resolver checks", () => {
        let warn: jest.SpyInstance;

        beforeEach(() => {
            warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        });

        afterEach(() => {
            warn.mockReset();
        });

        test("Check throws error if customResolver is not provided", async () => {
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            expect(warn).toHaveBeenCalledWith(`Custom resolver for ${customResolverField} has not been provided`);
        });

        test("Check throws error if custom resolver defined for interface", async () => {
            const interfaceType = new UniqueType("UserInterface");
            const typeDefs = `
                interface ${interfaceType.name} {
                    ${customResolverField}: String @customResolver(requires: "firstName lastName")
                }

                type ${testType} implements ${interfaceType.name} {
                    id: ID!
                    firstName: String!
                    lastName: String!
                    ${customResolverField}: String
                }
            `;

            const testResolver = () => "Some value";
            const resolvers = {
                [interfaceType.name]: {
                    [customResolverField]: testResolver,
                },
            };
            const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
            await neoSchema.getSchema();
            expect(warn).toHaveBeenCalledWith(`Custom resolver for ${customResolverField} has not been provided`);
        });
    });
});

describe("Related Fields", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    let Publication: UniqueType;
    let Author: UniqueType;
    let Book: UniqueType;
    let Journal: UniqueType;
    let User: UniqueType;
    let Address: UniqueType;
    let City: UniqueType;
    let State: UniqueType;

    const userInput1 = {
        id: "1",
        firstName: "First",
        lastName: "Last",
    };
    const userInput2 = {
        id: "2",
        firstName: "New First",
        lastName: "new-last",
    };
    const addressInput1 = {
        city: "some city",
        street: "some street",
    };
    const addressInput2 = {
        city: "another-city",
        street: "another-street",
    };
    const cityInput1 = {
        name: "city1 name!",
        population: 8947975,
    };
    const cityInput2 = {
        name: "city2 name?",
        population: 74,
    };
    const stateInput = {
        someValue: 4797,
    };
    const authorInput1 = {
        name: "some-author-name",
    };
    const authorInput2 = {
        name: "another author name",
    };
    const bookInput1 = {
        title: "a book name",
        publicationYear: 12,
    };
    const bookInput2 = {
        title: "another-book-name",
        publicationYear: 1074,
    };
    const journalInput1 = {
        subject: "a subject",
        publicationYear: 573,
    };
    const journalInput2 = {
        subject: "a second subject",
        publicationYear: 9087,
    };
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(() => {
        Publication = new UniqueType("Publication");
        Author = new UniqueType("Author");
        Book = new UniqueType("Book");
        Journal = new UniqueType("Journal");
        User = new UniqueType("User");
        Address = new UniqueType("Address");
        City = new UniqueType("City");
        State = new UniqueType("State");
    });

    afterEach(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodes(session, [Publication, Author, Book, Journal, User, Address, City, State]);
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to require a field from a related type", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (user:${User})-[:LIVES_AT]->(addr:${Address}) SET user = $userInput1, addr = $addressInput1`,
                { userInput1, addressInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    fullName
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: [
                {
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: addressInput1.city },
                    }),
                },
            ],
        });
    });

    test("should throw an error if requiring a field that does not exist", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (user:${User})-[:LIVES_AT]->(addr:${Address}) SET user = $userInput1, addr = $addressInput1`,
                { userInput1, addressInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city } doesNotExist")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(
            `Invalid selection set provided to @customResolver on ${User}`
        );
    });

    test("should throw an error if requiring a related field that does not exist", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (user:${User})-[:LIVES_AT]->(addr:${Address}) SET user = $userInput1, addr = $addressInput1`,
                { userInput1, addressInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city doesNotExist }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(
            `Invalid selection set provided to @customResolver on ${User}`
        );
    });

    test("should fetch required fields when other fields are also selected", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (user:${User})-[:LIVES_AT]->(addr:${Address}) SET user = $userInput1, addr = $addressInput1`,
                { userInput1, addressInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    id
                    fullName
                    address {
                        street
                        city
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: [
                {
                    id: userInput1.id,
                    address: addressInput1,
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: addressInput1.city },
                    }),
                },
            ],
        });
    });

    test("should fetch customResolver fields over multiple users", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address}) SET user1 = $userInput1, addr1 = $addressInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address}) SET user2 = $userInput2, addr2 = $addressInput2
                `,
                { userInput1, addressInput1, userInput2, addressInput2 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    id
                    fullName
                    address {
                        street
                        city
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    id: userInput1.id,
                    address: addressInput1,
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: addressInput1.city },
                    }),
                },
                {
                    id: userInput2.id,
                    address: addressInput2,
                    fullName: fullNameResolver({
                        firstName: userInput2.firstName,
                        lastName: userInput2.lastName,
                        address: { city: addressInput2.city },
                    }),
                },
            ]),
        });
    });

    test("should select related fields when not selected last", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address}) SET user1 = $userInput1, addr1 = $addressInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address}) SET user2 = $userInput2, addr2 = $addressInput2
                `,
                { userInput1, addressInput1, userInput2, addressInput2 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName address { city } lastName")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => `${firstName} ${lastName} from ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    id
                    fullName
                    address {
                        street
                        city
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    id: userInput1.id,
                    address: addressInput1,
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: addressInput1.city },
                    }),
                },
                {
                    id: userInput2.id,
                    address: addressInput2,
                    fullName: fullNameResolver({
                        firstName: userInput2.firstName,
                        lastName: userInput2.lastName,
                        address: { city: addressInput2.city },
                    }),
                },
            ]),
        });
    });

    test("should select fields from double nested related nodes", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                { userInput1, addressInput1, userInput2, addressInput2, cityInput1, cityInput2 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${City} {
                name: String!
                population: Int
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    address: {
                        street: addressInput1.street,
                    },
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: cityInput1 },
                    }),
                },
                {
                    address: {
                        street: addressInput2.street,
                    },
                    fullName: fullNameResolver({
                        firstName: userInput2.firstName,
                        lastName: userInput2.lastName,
                        address: { city: cityInput2 },
                    }),
                },
            ]),
        });
    });

    test("should select fields from triple nested related nodes", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                        -[:IN_STATE]->(state:${State})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1, state = $stateInput
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                        -[:IN_STATE]->(state)
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                { userInput1, addressInput1, userInput2, addressInput2, cityInput1, cityInput2, stateInput }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${State} {
                someValue: Int!
            }

            type ${City} {
                name: String!
                population: Int
                state: ${State}! @relationship(type: "IN_STATE", direction: OUT)
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name state { someValue } population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population} with ${address.city.state.someValue}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    address: {
                        street: addressInput1.street,
                    },
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: {
                            city: {
                                name: cityInput1.name,
                                population: cityInput1.population,
                                state: stateInput,
                            },
                        },
                    }),
                },
                {
                    address: {
                        street: addressInput2.street,
                    },
                    fullName: fullNameResolver({
                        firstName: userInput2.firstName,
                        lastName: userInput2.lastName,
                        address: {
                            city: {
                                name: cityInput2.name,
                                population: cityInput2.population,
                                state: stateInput,
                            },
                        },
                    }),
                },
            ]),
        });
    });

    test("should be able to require fields from a related union", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (author1:${Author})-[:WROTE]->(book1:${Book}) SET author1 = $authorInput1, book1 = $bookInput1
                    CREATE (author2:${Author})-[:WROTE]->(journal1:${Journal}) SET author2 = $authorInput2, journal1 = $journalInput1
                    CREATE (author2)-[:WROTE]->(journal2:${Journal}) SET journal2 = $journalInput2
                    CREATE (author2)-[:WROTE]->(book2:${Book}) SET book2 = $bookInput2
                    CREATE (author1)-[:WROTE]->(journal1)
                `,
                { authorInput1, authorInput2, bookInput1, bookInput2, journalInput1, journalInput2 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            union ${Publication} = ${Book} | ${Journal}

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
                publicationsWithAuthor: [String!]!
                    @customResolver(requires: "name publications { ...on ${Book} { title } ... on ${Journal} { subject } }")
            }

            type ${Book} {
                title: String!
                author: ${Author}! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} {
                subject: String!
                author: ${Author}! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const publicationsWithAuthorResolver = ({ name, publications }) =>
            publications.map((publication) => `${publication.title || publication.subject} by ${name}`);

        const resolvers = {
            [Author.name]: {
                publicationsWithAuthor: publicationsWithAuthorResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${Author} {
                ${Author.plural} {
                    publicationsWithAuthor
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Author.plural]: expect.toIncludeSameMembers([
                {
                    publicationsWithAuthor: expect.toIncludeSameMembers(
                        publicationsWithAuthorResolver({
                            name: authorInput1.name,
                            publications: [bookInput1, journalInput1],
                        })
                    ),
                },
                {
                    publicationsWithAuthor: expect.toIncludeSameMembers(
                        publicationsWithAuthorResolver({
                            name: authorInput2.name,
                            publications: [journalInput1, journalInput2, bookInput2],
                        })
                    ),
                },
            ]),
        });
    });

    test("should select @alias fields", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                {
                    userInput1: { id: userInput1.id, first: userInput1.firstName, lastName: userInput1.lastName },
                    addressInput1,
                    userInput2: { id: userInput2.id, first: userInput2.firstName, lastName: userInput2.lastName },
                    addressInput2,
                    cityInput1: { name: cityInput1.name, cityPopulation: cityInput1.population },
                    cityInput2: { name: cityInput2.name, cityPopulation: cityInput2.population },
                }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql` 
            type ${City} {
                name: String!
                population: Int @alias(property: "cityPopulation")
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String! @alias(property: "first")
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    firstName
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    address: {
                        street: addressInput1.street,
                    },
                    firstName: userInput1.firstName,
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: cityInput1 },
                    }),
                },
                {
                    address: {
                        street: addressInput2.street,
                    },
                    firstName: userInput2.firstName,
                    fullName: fullNameResolver({
                        firstName: userInput2.firstName,
                        lastName: userInput2.lastName,
                        address: { city: cityInput2 },
                    }),
                },
            ]),
        });
    });

    test("should still prevent access to @auth fields when not authenticated", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                {
                    userInput1,
                    addressInput1,
                    userInput2,
                    addressInput2,
                    cityInput1,
                    cityInput2,
                }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            type ${City} {
                name: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])
                population: Int
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String! @authorization(validate: [{ when: [BEFORE], where: { node: { id: "$jwt.sub" } } }])
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
            features: { authorization: { key: "secret" } },
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    firstName
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should prevent access to top-level @auth fields when rules are not met", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                {
                    userInput1,
                    addressInput1,
                    userInput2,
                    addressInput2,
                    cityInput1,
                    cityInput2,
                }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            type ${City} {
                name: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])
                population: Int
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String! @authorization(validate: [{ when: [BEFORE], where: { node: { id: "$jwt.sub" } } }])
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
            features: { authorization: { key: "secret" } },
        });

        const query = `
            query ${User} {
                ${User.plural}(where: { id: "1" }) {
                    firstName
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "not 1", roles: ["admin"] });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should prevent access to nested @auth fields when rules are not met", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                {
                    userInput1,
                    addressInput1,
                    userInput2,
                    addressInput2,
                    cityInput1,
                    cityInput2,
                }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            type ${City} {
                name: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])
                population: Int
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String! @authorization(validate: [{ when: [BEFORE], where: { node: { id: "$jwt.sub" } } }])
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
            features: { authorization: { key: "secret" } },
        });

        const query = `
            query ${User} {
                ${User.plural}(where: { id: "1" }) {
                    firstName
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1", roles: ["not-admin"] });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should allow access to @auth fields when rules are met", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:LIVES_AT]->(addr1:${Address})-[:IN_CITY]->(city1:${City})
                    SET user1 = $userInput1, addr1 = $addressInput1, city1 = $cityInput1
                    CREATE (user2:${User})-[:LIVES_AT]->(addr2:${Address})-[:IN_CITY]->(city2:${City})
                    SET user2 = $userInput2, addr2 = $addressInput2, city2 = $cityInput2
                `,
                {
                    userInput1,
                    addressInput1,
                    userInput2,
                    addressInput2,
                    cityInput1,
                    cityInput2,
                }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            type ${City} {
                name: String! @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])
                population: Int
            }

            type ${Address} {
                street: String!
                city: ${City}! @relationship(type: "IN_CITY", direction: OUT)
            }

            type ${User} {
                id: ID!
                firstName: String! @authorization(validate: [{ when: [BEFORE], where: { node: { id: "$jwt.sub" } } }])
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { city { name population } }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) => {
            if (address.city.population) {
                return `${firstName} ${lastName} from ${address.city.name} with population of ${address.city.population}`;
            }
            return `${firstName} ${lastName} from ${address.city.name}`;
        };

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
            features: { authorization: { key: "secret" } },
        });

        const query = `
            query ${User} {
                ${User.plural}(where: { id: "1" }) {
                    firstName
                    fullName
                    address {
                        street
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "1", roles: ["admin"] });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    address: {
                        street: addressInput1.street,
                    },
                    firstName: userInput1.firstName,
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { city: cityInput1 },
                    }),
                },
            ]),
        });
    });

    test("should be able to require fields from a related interface", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (author1:${Author})-[:WROTE]->(book1:${Book}) SET author1 = $authorInput1, book1 = $bookInput1
                    CREATE (author2:${Author})-[:WROTE]->(journal1:${Journal}) SET author2 = $authorInput2, journal1 = $journalInput1
                    CREATE (author1)-[:WROTE]->(journal1)
                `,
                { authorInput1, authorInput2, bookInput1, journalInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
                publicationsWithAuthor: [String!]!
                    @customResolver(
                        requires: "name publications { publicationYear ...on ${Book} { title } ... on ${Journal} { subject } }"
                    )
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const publicationsWithAuthorResolver = ({ name, publications }) =>
            publications.map(
                (publication) =>
                    `${publication.title || publication.subject} by ${name} in ${publication.publicationYear}`
            );

        const resolvers = {
            [Author.name]: {
                publicationsWithAuthor: publicationsWithAuthorResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${Author} {
                ${Author.plural} {
                    publicationsWithAuthor
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Author.plural]: expect.toIncludeSameMembers([
                {
                    publicationsWithAuthor: expect.toIncludeSameMembers(
                        publicationsWithAuthorResolver({
                            name: authorInput1.name,
                            publications: [bookInput1, journalInput1],
                        })
                    ),
                },
                {
                    publicationsWithAuthor: expect.toIncludeSameMembers(
                        publicationsWithAuthorResolver({
                            name: authorInput2.name,
                            publications: [journalInput1],
                        })
                    ),
                },
            ]),
        });
    });

    test("should be able to require fields from a nested related interface", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:FOLLOWS]->(author1:${Author})-[:WROTE]->(book1:${Book})
                    SET user1 = $userInput1, author1 = $authorInput1, book1 = $bookInput1
                    CREATE (user1)-[:FOLLOWS]->(author2:${Author})-[:WROTE]->(journal1:${Journal}) SET author2 = $authorInput2, journal1 = $journalInput1
                    CREATE (author1)-[:WROTE]->(journal1)
                `,
                { userInput1, authorInput1, authorInput2, bookInput1, journalInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { publicationYear ...on ${Book} { title } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    customResolverField
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    customResolverField: customResolver({
                        firstName: userInput1.firstName,
                        followedAuthors: [
                            {
                                name: authorInput1.name,
                                publications: [bookInput1, journalInput1],
                            },
                            {
                                name: authorInput2.name,
                                publications: [journalInput1],
                            },
                        ],
                    }),
                },
            ]),
        });
    });

    test("should be able to require fields from a nested related union", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:FOLLOWS]->(author1:${Author})-[:WROTE]->(book1:${Book})
                    SET user1 = $userInput1, author1 = $authorInput1, book1 = $bookInput1
                    CREATE (user1)-[:FOLLOWS]->(author2:${Author})-[:WROTE]->(journal1:${Journal}) SET author2 = $authorInput2, journal1 = $journalInput1
                    CREATE (author1)-[:WROTE]->(journal1)
                `,
                { userInput1, authorInput1, authorInput2, bookInput1, journalInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { ...on ${Book} { title } ... on ${Journal} { subject } } } firstName")
            }

            union ${Publication} = ${Book} | ${Journal}

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} {
                title: String!
                author: ${Author}! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} {
                subject: String!
                author: ${Author}! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    customResolverField
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: expect.toIncludeSameMembers([
                {
                    customResolverField: customResolver({
                        firstName: userInput1.firstName,
                        followedAuthors: [
                            {
                                name: authorInput1.name,
                                publications: [bookInput1, journalInput1],
                            },
                            {
                                name: authorInput2.name,
                                publications: [journalInput1],
                            },
                        ],
                    }),
                },
            ]),
        });
    });

    test("should throw an error if not using ...on for related unions", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (user1:${User})-[:FOLLOWS]->(author1:${Author})-[:WROTE]->(book1:${Book})
                    SET user1 = $userInput1, author1 = $authorInput1, book1 = $bookInput1
                    CREATE (user1)-[:FOLLOWS]->(author2:${Author})-[:WROTE]->(journal1:${Journal}) SET author2 = $authorInput2, journal1 = $journalInput1
                    CREATE (author1)-[:WROTE]->(journal1)
                `,
                { userInput1, authorInput1, authorInput2, bookInput1, journalInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { ...on ${Book} { title } subject } } firstName")
            }

            union ${Publication} = ${Book} | ${Journal}

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} {
                title: String!
                author: ${Author}! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} {
                subject: String!
                author: ${Author}! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(
            `Invalid selection set provided to @customResolver on ${User}`
        );
    });

    test("should throw an error when requiring another @customResolver field", async () => {
        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${User} {
                id: ID!
                firstName: String! @customResolver
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { publicationYear ...on ${Book} { title } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
                firstName: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(INVALID_REQUIRED_FIELD_ERROR);
    });

    test("should throw an error when requiring another @customResolver field on a nested type", async () => {
        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int! @customResolver
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { publicationYear ...on ${Book} { title } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
            [Publication.name]: {
                publicationYear: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(INVALID_REQUIRED_FIELD_ERROR);
    });

    test("should throw an error when requiring another @customResolver field on an implementation of a nested interface", async () => {
        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { publicationYear ...on ${Book} { title } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int! @customResolver
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
            [Book.name]: {
                publicationYear: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(INVALID_REQUIRED_FIELD_ERROR);
    });

    test("should throw an error when requiring another @customResolver field using ...on on an implementation of a nested interface", async () => {
        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { ...on ${Book} { title publicationYear } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int! @customResolver
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
            [Book.name]: {
                publicationYear: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).rejects.toThrow(INVALID_REQUIRED_FIELD_ERROR);
    });

    test("should not throw an error if there is another @customResolver field on the same type that is not required", async () => {
        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String! @customResolver
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { publicationYear ...on ${Book} { title } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
                lastName: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should not throw an error if there is another @customResolver field on a different implementation of the same interface when using ...on", async () => {
        const typeDefs = gql`
            interface ${Publication} {
                publicationYear: Int!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                followedAuthors: [${Author}!]! @relationship(type: "FOLLOWS", direction: OUT)
                customResolverField: Int @customResolver(requires: "followedAuthors { name publications { ...on ${Book} { title publicationYear } ... on ${Journal} { subject } } } firstName")
            }

            type ${Author} {
                name: String!
                publications: [${Publication}!]! @relationship(type: "WROTE", direction: OUT)
            }

            type ${Book} implements ${Publication} {
                title: String!
                publicationYear: Int!
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }

            type ${Journal} implements ${Publication} {
                subject: String!
                publicationYear: Int! @customResolver
                author: [${Author}!]! @relationship(type: "WROTE", direction: IN)
            }
        `;

        const customResolver = ({ firstName, followedAuthors }) => {
            let count = 0;
            count += firstName.length;
            followedAuthors.forEach((author) => {
                count += author.name.length;
                author.publications.forEach((publication) => {
                    if (publication.name) count += publication.name.length;
                    if (publication.subject) count += publication.subject.length;
                    count += publication.publicationYear;
                });
            });
            return count;
        };

        const resolvers = {
            [User.name]: {
                customResolverField: customResolver,
            },
            [Journal.name]: {
                publicationYear: customResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });

    test("should receive undefined for related fields that are not selected", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (user:${User})-[:LIVES_AT]->(addr:${Address}) SET user = $userInput1, addr = $addressInput1`,
                { userInput1, addressInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                houseNumber: Int! @cypher(statement: "RETURN 12 AS number", columnName: "number")
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { houseNumber street }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) =>
            `${firstName} ${lastName} from ${address.houseNumber} ${address.street} ${address.city}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    fullName
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: [
                {
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { street: addressInput1.street, houseNumber: 12 },
                    }),
                },
            ],
        });
    });

    test("should be able to require a @cypher field on a related type", async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `CREATE (user:${User})-[:LIVES_AT]->(addr:${Address}) SET user = $userInput1, addr = $addressInput1`,
                { userInput1, addressInput1 }
            );
        } finally {
            await session.close();
        }

        const typeDefs = gql`
            type ${Address} {
                houseNumber: Int! @cypher(statement: "RETURN 12 AS number", columnName: "number")
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { houseNumber street }")
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) =>
            `${firstName} ${lastName} from ${address.houseNumber} ${address.street}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    fullName
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [User.plural]: [
                {
                    fullName: fullNameResolver({
                        firstName: userInput1.firstName,
                        lastName: userInput1.lastName,
                        address: { street: addressInput1.street, houseNumber: 12 },
                    }),
                },
            ],
        });
    });

    test("should not throw an error for invalid type defs when validate is false", async () => {
        const typeDefs = gql`
            type ${Address} {
                houseNumber: Int! @cypher(statement: "RETURN 12 AS number", columnName: "number")
                street: String!
                city: String!
            }

            type ${User} {
                id: ID!
                firstName: String!
                lastName: String!
                address: ${Address} @relationship(type: "LIVES_AT", direction: OUT)
                fullName: String @customResolver(requires: "firstName lastName address { houseNumber street }")
            }

            type Point {
                latitude: Float!
                longitude: Float!
            }
        `;

        const fullNameResolver = ({ firstName, lastName, address }) =>
            `${firstName} ${lastName} from ${address.houseNumber} ${address.street}`;

        const resolvers = {
            [User.name]: {
                fullName: fullNameResolver,
            },
        };

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers,
            validate: false,
        });

        const query = `
            query ${User} {
                ${User.plural} {
                    fullName
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
    });
});
