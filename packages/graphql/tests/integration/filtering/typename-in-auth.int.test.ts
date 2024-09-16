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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("typename_IN with auth", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "secret";

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Series: UniqueType;
    let Cartoon: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Series = testHelper.createUniqueType("Series");
        Cartoon = testHelper.createUniqueType("Cartoon");
        typeDefs = `
        interface Production {
            title: String!
            cost: Float!
        }

        type ${Movie.name} implements Production {
            title: String!
            cost: Float!
            runtime: Int!
        }

        type ${Series.name} implements Production {
            title: String!
            cost: Float!
            episodes: Int!
        }

        type ${Cartoon.name} implements Production {
            title: String!
            cost: Float!
            cartoonist: String!
        }

        type ActedIn @relationshipProperties {
            screenTime: Int!
        }

        type ${Actor.name}  {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
        `;

        await testHelper.executeCypher(`
            CREATE(a:${Actor.name} { name: "Keanu" })
            CREATE(a)-[:ACTED_IN]->(m:${Movie.name} { title: "The Matrix" })
            CREATE(a)-[:ACTED_IN]->(s:${Series.name} { title: "The Matrix animated series" })
            CREATE(a)-[:ACTED_IN]->(c:${Cartoon.name} { title: "Matrix the cartoon" })
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should pass with a correct validate typename predicate", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Movie.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    )
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                name
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                },
            ]),
        });
    });

    test("should fail with an incorrect validate typename predicate", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Series.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    )
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                name
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(queryResult.errors?.[0]?.message).toContain("Forbidden");
    });

    test("should pass with a correct validate typename predicate (field level)", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                     {
                        name: String! @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Movie.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    )
                    }
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                name
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                },
            ]),
        });
    });

    test("should fail with an incorrect validate typename predicate (field level)", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                   {
                        name: String! @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Series.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    ) 
                    }
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                name
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(queryResult.errors?.[0]?.message).toContain("Forbidden");
    });

    test("should pass with an incorrect validate typename predicate (field level), when field is not selected", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                    {
                        name: String! @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                operations: [READ]
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Series.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    )
                    }
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                actedIn {
                    title
                }
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    actedIn: expect.arrayContaining([
                        {
                            title: "The Matrix",
                        },
                    ]),
                },
            ]),
        });
    });

    test("should return data with a correct filter typename predicate", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                    @authorization(
                        filter: [
                            {
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Movie.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    )
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                name
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                },
            ]),
        });
    });

    test("should not return data with an incorrect filter typename predicate", async () => {
        const authTypeDefs =
            typeDefs +
            /* GraphQL */ `
                extend type ${Actor.name}
                    @authorization(
                        filter: [
                            {
                                where: {
                                    node: {
                                        actedInConnection_SOME: { node: { AND: [ { title: "The Matrix" }, {typename_IN: [${Series.name}] }] } } 
                                    }
                                }
                            }
                        ]
                    )
            `;
        await testHelper.initNeo4jGraphQL({
            typeDefs: authTypeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
            ${Actor.plural} {
                name
            }
        }  
        `;
        const token = createBearerToken(secret, {});

        const queryResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(queryResult.data).toEqual({ [Actor.plural]: expect.toBeArrayOfSize(0) });
    });
});
