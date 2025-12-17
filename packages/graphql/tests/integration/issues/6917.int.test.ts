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

describe("https://github.com/neo4j/graphql/issues/6917", () => {
    let personType: UniqueType;
    let carType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        personType = testHelper.createUniqueType("Person");
        carType = testHelper.createUniqueType("Car");

        const typeDefs = `
            type ${personType.name} @node {
                name: String
                cars: [${carType.name}!]! @relationship (type: "CAR_IS_OWNED_BY_PERSON", properties: "CarIsOwnedByPersonProperties", direction: IN, nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT], queryDirection: DIRECTED) @settable(onCreate: true, onUpdate: true)
            }

            type ${carType.name} @node {
                name: String
                color: String
                owner: [${personType.name}!]! @relationship (type: "CAR_IS_OWNED_BY_PERSON", properties: "CarIsOwnedByPersonProperties", direction: OUT, nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT], queryDirection: DIRECTED) @settable(onCreate: true, onUpdate: true)
            }

            type CarIsOwnedByPersonProperties @relationshipProperties {
                order: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE (:${personType.name}{name:"Michael"})<-[:CAR_IS_OWNED_BY_PERSON{order:1}]-(:${carType.name}{name:"Jeep", color:"black"});
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should match 1 edge by node filter, aggregate count 1", async () => {
        const query = `
        query {
            ${personType.plural}(where: {name: { eq: "Michael" } } ) {
                name
                carsConnection {
                    edges {
                        properties {
                            order
                        }
                        node {
                            color
                            name
                        }
                    }
                    aggregate {
                        count {
                            edges
                        }
                    }
                }
            }
        }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [personType.plural]: [
                {
                    name: "Michael",
                    carsConnection: {
                        edges: [
                            {
                                properties: {
                                    order: 1,
                                },
                                node: {
                                    color: "black",
                                    name: "Jeep",
                                },
                            },
                        ],
                        aggregate: {
                            count: {
                                edges: 1,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("should match 1 edge by edge filter, aggregate count 1", async () => {
        const query = `
        query {
            ${personType.plural}(where: {name: { eq: "Michael" } } ) {
                name
                carsConnection(where: { edge: { order: { eq: 1 } } }) {
                    edges {
                        properties {
                            order
                        }
                        node {
                            color
                            name
                        }
                    }
                    aggregate {
                        count {
                            edges
                        }
                    }
                }
            }
        }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [personType.plural]: [
                {
                    name: "Michael",
                    carsConnection: {
                        edges: [
                            {
                                properties: {
                                    order: 1,
                                },
                                node: {
                                    color: "black",
                                    name: "Jeep",
                                },
                            },
                        ],
                        aggregate: {
                            count: {
                                edges: 1,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("should not match any edge by node filter, aggregate count 0", async () => {
        const query = `
        query {
            ${personType.plural}(where: {name: { eq: "Michael" } } ) {
                name
                carsConnection(where: { node: { color: { contains: "red" } } }) {
                    edges {
                        properties {
                            order
                        }
                        node {
                            color
                            name
                        }
                    }
                    aggregate {
                        count {
                            edges
                        }
                    }
                }
            }
        }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [personType.plural]: [
                {
                    name: "Michael",
                    carsConnection: {
                        edges: [],
                        aggregate: {
                            count: {
                                edges: 0,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("should not matcha any edge by edge filter, aggregate count 0", async () => {
        const query = `
        query {
            ${personType.plural}(where: {name: { eq: "Michael" } } ) {
                name
                carsConnection(where: { edge: { order: { gt: 1 } } }) {
                    edges {
                        properties {
                            order
                        }
                        node {
                            color
                            name
                        }
                    }
                    aggregate {
                        count {
                            edges
                        }
                    }
                }
            }
        }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [personType.plural]: [
                {
                    name: "Michael",
                    carsConnection: {
                        edges: [],
                        aggregate: {
                            count: {
                                edges: 0,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("should not match any edge by node filter in logical operator, aggregate count 0", async () => {
        const query = `
        query {
            ${personType.plural}(where: {name: { eq: "Michael" } } ) {
                name
                carsConnection( where: { OR: [ { node: { color: { contains: "red" } } } ] } ) {
                    edges {
                        properties {
                            order
                        }
                        node {
                            color
                            name
                        }
                    }
                    aggregate {
                        count {
                            edges
                        }
                    }
                }
            }
        }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [personType.plural]: [
                {
                    name: "Michael",
                    carsConnection: {
                        edges: [],
                        aggregate: {
                            count: {
                                edges: 0,
                            },
                        },
                    },
                },
            ],
        });
    });

    test("should not match any edge by edge filter in logical operator, aggregate count 0", async () => {
        const query = `
        query {
            ${personType.plural}(where: {name: { eq: "Michael" } } ) {
                name
                carsConnection( where: { OR: [ { edge: { order: { gt: 1 } } } ] } ) {
                    edges {
                        properties {
                            order
                        }
                        node {
                            color
                            name
                        }
                    }
                    aggregate {
                        count {
                            edges
                        }
                    }
                }
            }
        }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [personType.plural]: [
                {
                    name: "Michael",
                    carsConnection: {
                        edges: [],
                        aggregate: {
                            count: {
                                edges: 0,
                            },
                        },
                    },
                },
            ],
        });
    });
});
