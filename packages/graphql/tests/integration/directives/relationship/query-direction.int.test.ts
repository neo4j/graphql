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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("query-direction", () => {
    const testHelper = new TestHelper();
    let Person: UniqueType;
    let stefan: string;
    let mike: string;
    let charlie: string;

    beforeEach(async () => {
        Person = testHelper.createUniqueType("Person");
        stefan = "Stefan";
        mike = "Mike";
        charlie = "Charlie";

        await testHelper.executeCypher(
            `
                CREATE (stefan:${Person} { name: "${stefan}" })
                CREATE (mike:${Person} { name: "${mike}" })
                CREATE (charlie:${Person} { name: "${charlie}" })
                CREATE (stefan)-[:HAS_FRIEND]->(mike)
                CREATE (mike)-[:HAS_FRIEND]->(charlie)
            `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("DIRECTED", () => {
        beforeEach(async () => {
            const typeDefs = /* GraphQL */ `
                type ${Person} @node {
                    name: String!
                    friends: [${Person}!]! @relationship(type: "HAS_FRIEND", direction: OUT, queryDirection: DIRECTED)
                }
            `;
            await testHelper.initNeo4jGraphQL({ typeDefs });
        });

        test("should return related node using the queryDirection DIRECTED", async () => {
            const query = /* GraphQL */ `
                {
                    ${Person.plural}(where: { name_EQ: "${mike}" }) {
                        name
                        friends {
                            name
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.plural]: expect.toIncludeSameMembers([
                    {
                        name: mike,
                        friends: expect.toIncludeSameMembers([
                            {
                                name: charlie,
                            },
                        ]),
                    },
                ]),
            });
        });

        test("should return person with friend named Mike (directed out)", async () => {
            const query = /* GraphQL */ `
                {
                    ${Person.plural}(where: { friends_SOME: { name_EQ: "${mike}" } }) {
                        name
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.plural]: expect.toIncludeSameMembers([
                    {
                        name: stefan,
                    },
                ]),
            });
        });

        test("should delete two nodes when performing nested delete under delete (always directed)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.delete}(where: { name_EQ: "${mike}" }, delete: { friends: { where: { } } }) {
                        nodesDeleted
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.delete]: {
                    nodesDeleted: 2,
                },
            });
        });

        test("should only delete one when performing nested delete under update (always directed)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(where: { name_EQ: "${mike}" }, update: { friends: { delete: { where: { } } } }) {
                        ${Person.plural} {
                            name    
                            friends {
                                name
                            }
                        }
                        info {
                            nodesDeleted
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: expect.toIncludeSameMembers([
                        {
                            name: mike,
                            friends: [],
                        },
                    ]),
                    info: {
                        nodesDeleted: 1,
                    },
                },
            });
        });

        test("should only disconnect one when performing nested disconnect under update (always directed)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(where: { name_EQ: "${mike}" }, update: { friends: { disconnect: { where: { } } } }) {
                        ${Person.plural} {
                            name    
                            friends {
                                name
                            }
                        }
                        info {
                            relationshipsDeleted
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: expect.toIncludeSameMembers([
                        {
                            name: mike,
                            friends: [],
                        },
                    ]),
                    info: {
                        relationshipsDeleted: 1,
                    },
                },
            });
        });

        test("should only update one when performing nested update under update (always directed)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(where: { name_EQ: "${mike}" }, update: { friends: { update: { node: { name_SET: "Bob" } } } }) {
                        ${Person.plural} {
                            name    
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: expect.toIncludeSameMembers([
                        {
                            name: mike,
                            friends: expect.toIncludeSameMembers([{ name: "Bob" }]),
                        },
                    ]),
                },
            });
        });
    });

    describe("UNDIRECTED", () => {
        beforeEach(async () => {
            const typeDefs = /* GraphQL */ `
                type ${Person} @node {
                    name: String!
                    friends: [${Person}!]! @relationship(type: "HAS_FRIEND", direction: OUT, queryDirection: UNDIRECTED)
                }
            `;
            await testHelper.initNeo4jGraphQL({ typeDefs });
        });

        test("should return related node using the queryDirection UNDIRECTED", async () => {
            const query = /* GraphQL */ `
                {
                    ${Person.plural}(where: { name_EQ: "${mike}" }) {
                        name
                        friends {
                            name
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.plural]: expect.toIncludeSameMembers([
                    {
                        name: mike,
                        friends: expect.toIncludeSameMembers([
                            {
                                name: stefan,
                            },
                            {
                                name: charlie,
                            },
                        ]),
                    },
                ]),
            });
        });

        test("should return person with friend named Mike (undirected)", async () => {
            const query = /* GraphQL */ `
                {
                    ${Person.plural}(where: { friends_SOME: { name_EQ: "${mike}" } }) {
                        name
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.plural]: expect.toIncludeSameMembers([
                    {
                        name: stefan,
                    },
                    {
                        name: charlie,
                    },
                ]),
            });
        });

        test("should delete three nodes when performing nested delete under delete (undirected)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.delete}(where: { name_EQ: "${mike}" }, delete: { friends: { where: { } } }) {
                        nodesDeleted
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.delete]: {
                    nodesDeleted: 3,
                },
            });
        });

        test("should delete both connected nodes when performing nested delete under update (undirected)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(where: { name_EQ: "${mike}" }, update: { friends: { delete: { where: { } } } }) {
                        ${Person.plural} {
                            name    
                            friends {
                                name
                            }
                        }
                        info {
                            nodesDeleted
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: [{ name: mike, friends: [] }],
                    info: {
                        nodesDeleted: 2,
                    },
                },
            });
        });

        test("should disconnect both connected nodes when performing nested disconnect under update (undirected)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(where: { name_EQ: "${mike}" }, update: { friends: { disconnect: { where: { } } } }) {
                        ${Person.plural} {
                            name    
                            friends {
                                name
                            }
                        }
                        info {
                            relationshipsDeleted
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: [{ name: mike, friends: [] }],
                    info: {
                        relationshipsDeleted: 2,
                    },
                },
            });
        });

        test("should update both nodes when performing nested update under update (undirected)", async () => {
            const query = /* GraphQL */ `
                mutation {
                    ${Person.operations.update}(where: { name_EQ: "${mike}" }, update: { friends: { update: { node: { name_SET: "Bob" } } } }) {
                        ${Person.plural} {
                            name    
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult.data).toEqual({
                [Person.operations.update]: {
                    [Person.plural]: expect.toIncludeSameMembers([
                        {
                            name: mike,
                            friends: expect.toIncludeSameMembers([{ name: "Bob" }, { name: "Bob" }]),
                        },
                    ]),
                },
            });
        });
    });
});
