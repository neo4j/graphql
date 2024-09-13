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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2803", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;
    let ActedIn: UniqueType;

    const actorInput1 = {
        name: "some name",
    };
    const actorInput2 = {
        name: "some-other-name",
    };
    const actorInput3 = {
        name: "ThirdName",
    };
    const actorInput4 = {
        name: "!@£$@$ special char actor",
    };
    const actorInput5 = {
        name: "actor with an very long name indeed!",
    };

    const movieInput1 = {
        released: 1,
    };
    const movieInput2 = {
        released: 287598257,
    };
    const movieInput3 = {
        released: 3409,
    };
    const movieInput4 = {
        released: 4809567,
    };
    const movieInput5 = {
        released: 588,
    };

    const actedInInput1 = {
        roles: ["some char"],
        screenTime: 1,
    };
    const actedInInput2 = {
        roles: ["some other character", "second-character"],
        screenTime: 2984,
    };
    const actedInInput3 = {
        roles: ["12"],
        screenTime: 0,
    };
    const actedInInput4 = {
        roles: ["some-char"],
        screenTime: 456,
    };
    const actedInInput5 = {
        roles: ["char1", "char2", "char3!"],
        screenTime: 56,
    };
    const actedInInput6 = {
        roles: ["a role with a long ish name"],
        screenTime: 66,
    };
    const actedInInput7 = {
        roles: ["special char role *%|?~£$^%"],
        screenTime: 773,
    };
    const actedInInput8 = {
        roles: ["final role"],
        screenTime: 8904,
    };

    const updatedName = "a new name!";

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} {
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "${ActedIn}")
                released: Int!
            }

            type ${Actor} {
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "${ActedIn}")
                name: String
            }

            type ${ActedIn} @relationshipProperties {
                screenTime: Int!
                roles: [String!]!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
            CREATE (a1:${Actor})-[rel1:ACTED_IN]->(m1:${Movie})
            CREATE (a1)-[rel2:ACTED_IN]->(m2:${Movie})
            CREATE (a2:${Actor})-[rel3:ACTED_IN]->(m2)
            CREATE (a3:${Actor})-[rel4:ACTED_IN]->(m2)
            CREATE (a3)-[rel5:ACTED_IN]->(m3:${Movie})
            CREATE (a4:${Actor})-[rel6:ACTED_IN]->(m4:${Movie})
            CREATE (a4)-[rel7:ACTED_IN]->(m3)
            CREATE (a4)-[rel8:ACTED_IN]->(m2)
            CREATE (a5:${Actor})
            CREATE (m5:${Movie})
            SET a1 = $actorInput1, a2 = $actorInput2, a3 = $actorInput3, a4 = $actorInput4, a5 = $actorInput5,
                m1 = $movieInput1, m2 = $movieInput2, m3 = $movieInput3, m4 = $movieInput4, m5 = $movieInput5,
                rel1 = $actedInInput1, rel2 = $actedInInput2, rel3 = $actedInInput3, rel4 = $actedInInput4,
                rel5 = $actedInInput5, rel6 = $actedInInput6, rel7 = $actedInInput7, rel8 = $actedInInput8
        `,
            {
                actorInput1,
                actorInput2,
                actorInput3,
                actorInput4,
                actorInput5,
                movieInput1,
                movieInput2,
                movieInput3,
                movieInput4,
                movieInput5,
                actedInInput1,
                actedInInput2,
                actedInInput3,
                actedInInput4,
                actedInInput5,
                actedInInput6,
                actedInInput7,
                actedInInput8,
            }
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should find movies aggregate within double nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(where: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } }) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput3, actorInput4]),
        });
    });

    test("should find aggregations at all levels within double nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_SOME: {
                            actors_ALL: {
                                moviesAggregate: { count_GT: 1 }
                            },
                            actorsAggregate: { count: 1 }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput4]),
        });
    });

    test("should find movies aggregate within triple nested relationships", async () => {
        const query = `
            {
                ${Movie.plural}(
                    where: {
                        actors_SOME: {
                            movies_SOME: {
                                actors_ALL: {
                                    moviesAggregate: { count_GT: 2 }
                                }
                            }
                        }
                    }
                ) {
                    released
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([movieInput2, movieInput3, movieInput4]),
        });
    });

    test("should find aggregations at all levels within within triple nested relationships", async () => {
        const query = `
            {
                ${Movie.plural}(
                    where: {
                        actors_SINGLE: {
                            movies_SOME: {
                                actors_ALL: { moviesAggregate: { count_GT: 1 } }
                                actorsAggregate: { node: { name_AVERAGE_LT: 10 } }
                            }
                            moviesAggregate: { node: { released_AVERAGE_EQUAL: ${
                                (movieInput2.released + movieInput1.released) / 2
                            } } }
                        }
                        actorsAggregate: { node: { name_AVERAGE_GTE: 3 } }
                    }
                ) {
                    released
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([movieInput1, movieInput2]),
        });
    });

    test("should find movies aggregate within double nested connections", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        moviesConnection_SOME: {
                            node: {
                                actorsConnection_ALL: {
                                    node: { moviesAggregate: { count_GT: 1 }
                                }
                            }
                        }
                    }
                }) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput3, actorInput4]),
        });
    });

    test("should find aggregations at all levels within double nested connections", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_SOME: {
                            actorsConnection_ALL: {
                                node: {
                                    moviesAggregate: { count_GT: 1 }
                                }
                            },
                            actorsAggregate: { count: 1 }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput4]),
        });
    });

    test("should find movies aggregate within triple nested connections", async () => {
        const query = `
            {
                ${Movie.plural}(
                    where: {
                        actorsConnection_SOME: {
                            node: {
                                moviesConnection_SOME: {
                                    node: {
                                        actorsConnection_ALL: { 
                                            node: {
                                                moviesAggregate: { count_GT: 2 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    released
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([movieInput2, movieInput3, movieInput4]),
        });
    });

    test("should find aggregations at all levels within within triple nested connections", async () => {
        const query = `
            {
                ${Movie.plural}(
                    where: {
                        actorsConnection_SOME: {
                            node: {
                                moviesConnection_SOME: {
                                    node: {
                                        actorsConnection_ALL: { 
                                            node: {
                                                moviesAggregate: { count_GT: 1 }
                                            }
                                        }
                                        actorsAggregate: { node: { name_AVERAGE_LT: 10 } }
                                    }
                                }
                                moviesAggregate: { node: { released_AVERAGE_EQUAL: ${
                                    (movieInput2.released + movieInput1.released) / 2
                                } } }
                            }
                        }
                        actorsAggregate: { node: { name_AVERAGE_GTE: 3 } }
                    }
                ) {
                    released
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([movieInput1, movieInput2]),
        });
    });

    test("should find movies aggregate with connection nested in relationship", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_SOME: {
                            actorsConnection_ALL: {
                                node: {
                                    moviesAggregate: { count_GT: 1 }
                                }
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput3, actorInput4]),
        });
    });

    test("should find movies aggregate with relationship nested in connection", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        moviesConnection_SOME: {
                            node: {
                                actors_ALL: {
                                    moviesAggregate: { count_GT: 1 }
                                }
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput3, actorInput4]),
        });
    });

    test("should find movies aggregate with triple nested mix of relations and connections", async () => {
        const query = `
            {
                ${Movie.plural}(
                    where: {
                        actorsConnection_SOME: {
                            node: {
                                movies_SINGLE: {
                                    actorsConnection_NONE: { 
                                        node: {
                                            moviesAggregate: { count_GT: 2 }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    released
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([movieInput1, movieInput2]),
        });
    });

    test("should find edge aggregations at all levels within double nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_SINGLE: {
                            actors_NONE: {
                                moviesAggregate: { edge: { screenTime_AVERAGE_LTE: 1000 } }
                            },
                            actorsAggregate: { edge: { screenTime_AVERAGE_LTE: 1000 } }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput4]),
        });
    });

    test("should be able to filter by edge properties and aggregations in nested connections", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_NONE: {
                                    node: { moviesAggregate: { count_GT: 1 } }
                                    edge: {
                                        roles_INCLUDES: "${actedInInput4.roles[0]}"
                                    }
                                }
                            },
                            edge: {
                                roles_INCLUDES: "${actedInInput5.roles[0]}"
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput3]),
        });
    });

    test("should be able to filter by node properties, edge properties and aggregations in nested connections", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_SOME: {
                                    node: { 
                                        name: "${actorInput4.name}"
                                        moviesAggregate: { count_GT: 1 }
                                    }
                                    edge: {
                                        roles_INCLUDES: "${actedInInput7.roles[0]}"
                                    }
                                }
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput3, actorInput4]),
        });
    });

    test("should be able to filter by node properties and aggregations in nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_ALL: {
                            actors_SOME: {
                                name: "${actorInput4.name}"
                                moviesAggregate: { count_GT: 1 }
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput2, actorInput3, actorInput4]),
        });
    });

    test("should be able to use logical OR operators with aggregations in nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_ALL: {
                            actors_SOME: {
                                OR: [
                                    { name: "${actorInput4.name}" }
                                    { moviesAggregate: { count_GT: 1 } }
                                ]

                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput1, actorInput2, actorInput3, actorInput4]),
        });
    });

    test("should be able to use logical AND operators with aggregations in nested relationships", async () => {
        const query = `
            {
                ${Actor.plural}(
                    where: {
                        movies_ALL: {
                            actors_SOME: {
                                AND: [
                                    { name: "${actorInput4.name}" }
                                    { moviesAggregate: { count_GT: 1 } }
                                ]

                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([actorInput2, actorInput3, actorInput4]),
        });
    });

    test("should be able to filter update mutations by node properties, edge properties and aggregations in nested connections", async () => {
        const query = `
            mutation {
                ${Actor.operations.update}(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_NONE: {
                                    node: { moviesAggregate: { count_GT: 1 } }
                                    edge: {
                                        roles_INCLUDES: "${actedInInput4.roles[0]}"
                                    }
                                }
                            },
                            edge: {
                                roles_INCLUDES: "${actedInInput5.roles[0]}"
                            }
                        }
                    }
                    update: { name: "${updatedName}" }

                ) {
                    ${Actor.plural} {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.operations.update]: {
                [Actor.plural]: expect.toIncludeSameMembers([{ name: updatedName }]),
            },
        });
    });

    test("should be able to filter delete mutations by node properties, edge properties and aggregations in nested connections", async () => {
        const query = `
            mutation {
                ${Actor.operations.delete}(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_SOME: {
                                    node: { 
                                        name: "${actorInput4.name}"
                                        moviesAggregate: { count_GT: 1 }
                                    }
                                    edge: {
                                        roles_INCLUDES: "${actedInInput7.roles[0]}"
                                    }
                                }
                            }
                        }
                    }

                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.operations.delete]: {
                nodesDeleted: 2,
            },
        });
    });
});
