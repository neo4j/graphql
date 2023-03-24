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

import { mergeTreeDescriptors, getTreeDescriptor } from "./parser";
import { Neo4jGraphQL } from "../../../src";
import { gql } from "apollo-server";
import type { GraphQLCreateInput } from "./types";
import type Node from "../../classes/Node";
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";
import { int } from "neo4j-driver";

describe("TreeDescriptor Parser", () => {
    let typeDefs;
    let movieNode;
    let context;
    let schema;
    let nodes;
    let relationships;

    beforeAll(async () => {
        typeDefs = gql`
            type Actor {
                id: ID! @id
                name: String
                age: Int
                height: Int
                create: BigInt
                edge: CartesianPoint
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie {
                id: ID
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Website {
                create: BigInt
                edge: CartesianPoint
                address: String
            }

            interface ActedIn @relationshipProperties {
                year: Int
                create: BigInt
                edge: CartesianPoint
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        schema = await neoSchema.getSchema();
        nodes = neoSchema.nodes;
        relationships = neoSchema.relationships;

        movieNode = nodes.find((node) => node.name === "Movie") as unknown as Node;
        context = new ContextBuilder({
            neoSchema: { nodes, relationships },
            nodes,
            relationships,
            schema,
        }).instance();
    });

    test("it should be possible to parse the GraphQL input to obtain a TreeDescriptor", () => {
        const graphQLInput = {
            id: 3,
            website: {
                create: {
                    node: {
                        address: "www.xyz.com",
                    },
                },
            },
            actors: {
                create: [
                    {
                        node: {
                            name: "Keanu",
                        },
                        edge: {
                            year: 1992,
                        },
                    },
                ],
            },
        };
        const movieNode = nodes.find((node) => node.name === "Movie") as unknown as Node;
        const context = new ContextBuilder({
            neoSchema: { nodes, relationships },
            nodes,
            relationships,
            schema,
        }).instance();
        const treeDescriptor = Array.isArray(graphQLInput)
            ? mergeTreeDescriptors(
                  graphQLInput.map((el: GraphQLCreateInput) => getTreeDescriptor(el, movieNode, context))
              )
            : getTreeDescriptor(graphQLInput, movieNode, context);

        expect(treeDescriptor).toEqual({
            properties: new Set(["id"]),
            children: {
                website: {
                    properties: new Set(),
                    children: {
                        create: {
                            properties: new Set(),
                            children: {
                                node: {
                                    properties: new Set(["address"]),
                                    children: {},
                                },
                            },
                        },
                    },
                },
                actors: {
                    properties: new Set(),
                    children: {
                        create: {
                            properties: new Set(),
                            children: {
                                node: {
                                    properties: new Set(["name"]),
                                    children: {},
                                },
                                edge: {
                                    properties: new Set(["year"]),
                                    children: {},
                                },
                            },
                        },
                    },
                },
            },
        });
    });

    test("it should possible to obtain homogenous TreeDescriptor from an heterogeneous GraphQL input", () => {
        const graphQLInput = {
            id: 3,
            website: {
                create: {
                    node: {
                        address: "www.xyz.com",
                    },
                },
            },
            actors: {
                connect: {
                    where: {
                        node: {
                            id: "123",
                        },
                    },
                },
                connectOrCreate: {
                    where: {
                        node: {
                            id: "124",
                        },
                    },
                    onCreate: {
                        node: {
                            name: "Steven",
                        },
                    },
                },
                create: [
                    {
                        node: {
                            name: "Keanu",
                        },
                        edge: {
                            year: 1992,
                        },
                    },
                    {
                        node: {
                            age: 60,
                        },
                        edge: {
                            year: 1992,
                        },
                    },
                    {
                        node: {
                            height: 190,
                        },
                        edge: {
                            year: 1992,
                        },
                    },
                ],
            },
        };

        const treeDescriptor = Array.isArray(graphQLInput)
            ? mergeTreeDescriptors(
                  graphQLInput.map((el: GraphQLCreateInput) => getTreeDescriptor(el, movieNode, context))
              )
            : getTreeDescriptor(graphQLInput, movieNode, context);

        expect(treeDescriptor).toEqual({
            properties: new Set(["id"]),
            children: {
                website: {
                    properties: new Set(),
                    children: {
                        create: {
                            properties: new Set(),
                            children: {
                                node: {
                                    properties: new Set(["address"]),
                                    children: {},
                                },
                            },
                        },
                    },
                },
                actors: {
                    properties: new Set(),
                    children: {
                        create: {
                            properties: new Set(),
                            children: {
                                node: {
                                    properties: new Set(["name", "height", "age"]),
                                    children: {},
                                },
                                edge: {
                                    properties: new Set(["year"]),
                                    children: {},
                                },
                            },
                        },
                        connect: {
                            properties: new Set(),
                            children: {
                                where: {
                                    properties: new Set(),
                                    children: {
                                        node: {
                                            properties: new Set(["id"]),
                                            children: {},
                                        },
                                    },
                                },
                            },
                        },
                        connectOrCreate: {
                            properties: new Set(),
                            children: {
                                where: {
                                    properties: new Set(),
                                    children: {
                                        node: {
                                            properties: new Set(["id"]),
                                            children: {},
                                        },
                                    },
                                },
                                onCreate: {
                                    properties: new Set(),
                                    children: {
                                        node: {
                                            properties: new Set(["name"]),
                                            children: {},
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    });

    test("it should works for property with reserved name", () => {
        const graphQLInput = {
            id: 3,
            actors: {
                create: [
                    {
                        node: {
                            name: "Keanu",
                            create: int(123),
                            edge: { x: 10, y: 10 },
                            website: {
                                create: {
                                    node: {
                                        create: int(123),
                                        edge: { x: 10, y: 10 },
                                    },
                                },
                            },
                        },
                        edge: {
                            year: 1992,
                            create: int(123),
                            edge: { x: 10, y: 10 },
                        },
                    },
                ],
            },
        };
        const movieNode = nodes.find((node) => node.name === "Movie") as unknown as Node;
        const context = new ContextBuilder({
            neoSchema: { nodes, relationships },
            nodes,
            relationships,
            schema,
        }).instance();
        const treeDescriptor = Array.isArray(graphQLInput)
            ? mergeTreeDescriptors(
                  graphQLInput.map((el: GraphQLCreateInput) => getTreeDescriptor(el, movieNode, context))
              )
            : getTreeDescriptor(graphQLInput, movieNode, context);

        expect(treeDescriptor).toEqual({
            properties: new Set(["id"]),
            children: {
                actors: {
                    properties: new Set(),
                    children: {
                        create: {
                            properties: new Set(),
                            children: {
                                node: {
                                    properties: new Set(["name", "create", "edge"]),
                                    children: {
                                        website: {
                                            properties: new Set(),
                                            children: {
                                                create: {
                                                    properties: new Set(),
                                                    children: {
                                                        node: {
                                                            properties: new Set(["create", "edge"]),
                                                            children: {},
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                edge: {
                                    properties: new Set(["year", "create", "edge"]),
                                    children: {},
                                },
                            },
                        },
                    },
                },
            },
        });
    });
});
