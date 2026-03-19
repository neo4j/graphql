/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2669", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");

        const typeDefs = `
        type ${typeMovie.name} @node {
            title: String
            actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
        }

        type ${typeActor.name} @node {
            myName: String @alias(property: "name")
            age: Int
            movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }

        type ActedIn @relationshipProperties {
            time: Int @alias(property: "screentime")
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(:${typeActor.name} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
        CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typeActor.name} {name: "Linda", age:37, born: datetime('2000-02-02')})`);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Field Node Aggregation alias", async () => {
        const query = `
            query {
                ${typeMovie.plural} {
                    actorsConnection {
                        aggregate {
                            node {
                                myName {
                                    shortest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [typeMovie.plural]: [
                {
                    actorsConnection: {
                        aggregate: {
                            node: {
                                myName: {
                                    shortest: "Linda",
                                },
                            },
                        },
                    },
                },
            ],
        });
    });

    test("Field Edge Aggregation alias", async () => {
        const query = `
            query {
                ${typeMovie.plural} {
                    actorsConnection {
                        aggregate {
                            edge {
                                time {
                                    max
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [typeMovie.plural]: [
                {
                    actorsConnection: {
                        aggregate: {
                            edge: {
                                time: {
                                    max: 120,
                                },
                            },
                        },
                    },
                },
            ],
        });
    });
});
