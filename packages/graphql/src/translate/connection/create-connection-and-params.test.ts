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

import { ResolveTree } from "graphql-parse-resolve-info";
import { offsetToCursor } from "graphql-relay";
import dedent from "dedent";
import { mocked } from "ts-jest/utils";
import { ConnectionField, Context } from "../../types";
import createConnectionAndParams from "./create-connection-and-params";
import Neo4jGraphQL from "../../classes/Neo4jGraphQL";

jest.mock("../../classes/Neo4jGraphQL");

describe("createConnectionAndParams", () => {
    test("Returns entry with no args", () => {
        // @ts-ignore
        const mockedNeo4jGraphQL = mocked(new Neo4jGraphQL(), true);
        // @ts-ignore
        mockedNeo4jGraphQL.nodes = [
            // @ts-ignore
            {
                name: "Actor",
            },
        ];
        // @ts-ignore
        mockedNeo4jGraphQL.relationships = [
            // @ts-ignore
            {
                name: "MovieActorsRelationship",
                fields: [],
            },
        ];

        const resolveTree: ResolveTree = {
            alias: "actorsConnection",
            name: "actorsConnection",
            args: {},
            fieldsByTypeName: {
                MovieActorsConnection: {
                    edges: {
                        alias: "edges",
                        name: "edges",
                        args: {},
                        fieldsByTypeName: {
                            MovieActorsRelationship: {
                                screenTime: {
                                    alias: "screenTime",
                                    name: "screenTime",
                                    args: {},
                                    fieldsByTypeName: {},
                                },
                                // node: {
                                //     alias: "node",
                                //     name: "node",
                                //     args: {},
                                //     fieldsByTypeName: {
                                //         Actor: {
                                //             name: {
                                //                 alias: "name",
                                //                 name: "name",
                                //                 args: {},
                                //                 fieldsByTypeName: {},
                                //             },
                                //         },
                                //     },
                                // },
                            },
                        },
                    },
                },
            },
        };

        // @ts-ignore
        const field: ConnectionField = {
            fieldName: "actorsConnection",
            relationshipTypeName: "MovieActorsRelationship",
            // @ts-ignore
            typeMeta: {
                name: "MovieActorsConnection",
                required: true,
            },
            otherDirectives: [],
            // @ts-ignore
            relationship: {
                fieldName: "actors",
                type: "ACTED_IN",
                direction: "IN",
                // @ts-ignore
                typeMeta: {
                    name: "Actor",
                },
            },
        };

        // @ts-ignore
        const context: Context = { neoSchema: mockedNeo4jGraphQL };

        const entry = createConnectionAndParams({ resolveTree, field, context, nodeVariable: "this" });

        expect(dedent(entry[0])).toEqual(dedent`CALL {
        WITH this
        MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
        WITH collect({ screenTime: this_acted_in.screenTime }) AS edges
        RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
        }`);
    });

    test("Returns entry with sort arg", () => {
        // @ts-ignore
        const mockedNeo4jGraphQL = mocked(new Neo4jGraphQL(), true);
        // @ts-ignore
        mockedNeo4jGraphQL.nodes = [
            // @ts-ignore
            {
                name: "Actor",
            },
        ];
        // @ts-ignore
        mockedNeo4jGraphQL.relationships = [
            // @ts-ignore
            {
                name: "MovieActorsRelationship",
                fields: [],
            },
        ];

        const resolveTree: ResolveTree = {
            alias: "actorsConnection",
            name: "actorsConnection",
            args: {
                sort: [
                    {
                        node: {
                            name: "ASC",
                        },
                        relationship: {
                            screenTime: "DESC",
                        },
                    },
                ],
            },
            fieldsByTypeName: {
                MovieActorsConnection: {
                    edges: {
                        alias: "edges",
                        name: "edges",
                        args: {},
                        fieldsByTypeName: {
                            MovieActorsRelationship: {
                                screenTime: {
                                    alias: "screenTime",
                                    name: "screenTime",
                                    args: {},
                                    fieldsByTypeName: {},
                                },
                                // node: {
                                //     alias: "node",
                                //     name: "node",
                                //     args: {},
                                //     fieldsByTypeName: {
                                //         Actor: {
                                //             name: {
                                //                 alias: "name",
                                //                 name: "name",
                                //                 args: {},
                                //                 fieldsByTypeName: {},
                                //             },
                                //         },
                                //     },
                                // },
                            },
                        },
                    },
                },
            },
        };

        // @ts-ignore
        const field: ConnectionField = {
            fieldName: "actorsConnection",
            relationshipTypeName: "MovieActorsRelationship",
            // @ts-ignore
            typeMeta: {
                name: "MovieActorsConnection",
                required: true,
            },
            otherDirectives: [],
            // @ts-ignore
            relationship: {
                fieldName: "actors",
                type: "ACTED_IN",
                direction: "IN",
                // @ts-ignore
                typeMeta: {
                    name: "Actor",
                },
            },
        };

        // @ts-ignore
        const context: Context = { neoSchema: mockedNeo4jGraphQL };

        const entry = createConnectionAndParams({ resolveTree, field, context, nodeVariable: "this" });

        expect(dedent(entry[0])).toEqual(dedent`CALL {
            WITH this
            MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
            WITH this_acted_in, this_actor
            ORDER BY this_acted_in.screenTime DESC, this_actor.name ASC
            WITH collect({ screenTime: this_acted_in.screenTime }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }`);
    });

    test("Returns an entry with skip and limit args", () => {
        // @ts-ignore
        const mockedNeo4jGraphQL = mocked(new Neo4jGraphQL(), true);
        // @ts-ignore
        mockedNeo4jGraphQL.nodes = [
            // @ts-ignore
            {
                name: "Actor",
            },
        ];
        // @ts-ignore
        mockedNeo4jGraphQL.relationships = [
            // @ts-ignore
            {
                name: "MovieActorsRelationship",
                fields: [],
            },
        ];

        const resolveTree: ResolveTree = {
            alias: "actorsConnection",
            name: "actorsConnection",
            args: {
                first: 10,
                after: offsetToCursor(10),
            },
            fieldsByTypeName: {
                MovieActorsConnection: {
                    edges: {
                        alias: "edges",
                        name: "edges",
                        args: {},
                        fieldsByTypeName: {
                            MovieActorsRelationship: {
                                screenTime: {
                                    alias: "screenTime",
                                    name: "screenTime",
                                    args: {},
                                    fieldsByTypeName: {},
                                },
                            },
                        },
                    },
                },
            },
        };

        const field: ConnectionField = {
            fieldName: "actorsConnection",
            relationshipTypeName: "MovieActorsRelationship",
            // @ts-ignore
            typeMeta: {
                name: "MovieActorsConnection",
                required: true,
            },
            otherDirectives: [],
            // @ts-ignore
            relationship: {
                fieldName: "actors",
                type: "ACTED_IN",
                direction: "IN",
                // @ts-ignore
                typeMeta: {
                    name: "Actor",
                },
            },
        };

        // @ts-ignore
        const context: Context = { neoSchema: mockedNeo4jGraphQL };

        const entry = createConnectionAndParams({ resolveTree, field, context, nodeVariable: "this" });

        expect(dedent(entry[0])).toEqual(dedent`CALL {
            WITH this
            MATCH (this)<-[this_acted_in:ACTED_IN]-(this_actor:Actor)
            WITH collect({ screenTime: this_acted_in.screenTime }) AS edges
            WITH this, edges, size(edges) AS totalCount, edges([10..10]) AS limitedSelection
            RETURN { edges: limitedSelection, totalCount: totalCount } AS actorsConnection
            }`);
    });
});
