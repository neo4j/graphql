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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { offsetToCursor } from "graphql-relay";
import dedent from "dedent";
import type { ConnectionField, Context } from "../../types";
import createConnectionAndParams from "./create-connection-and-params";
import Neo4jGraphQL from "../../classes/Neo4jGraphQL";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import { RelationshipQueryDirectionOption } from "../../constants";

jest.mock("../../classes/Neo4jGraphQL");

describe("createConnectionAndParams", () => {
    test("Returns entry with no args", () => {
        // @ts-ignore
        const mockedNeo4jGraphQL = jest.mocked(new Neo4jGraphQL(), true);

        const nodes = [
            // @ts-ignore
            new NodeBuilder({
                name: "Actor",
            }).instance(),
        ];
        const relationships = [
            // @ts-ignore
            {
                name: "MovieActorsRelationship",
                temporalFields: [],
                enumFields: [],
                computedFields: [],
                pointFields: [],
                primitiveFields: [],
                scalarFields: [],
            },
        ];

        // @ts-ignore
        mockedNeo4jGraphQL.nodes = nodes;
        // @ts-ignore
        mockedNeo4jGraphQL.relationships = relationships;

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
                queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                // @ts-ignore
                typeMeta: {
                    name: "Actor",
                },
            },
        };

        // @ts-ignore
        const context: Context = { neoSchema: mockedNeo4jGraphQL, nodes, relationships };

        const entry = createConnectionAndParams({ resolveTree, field, context, nodeVariable: "this" });

        expect(entry[0]).toMatchInlineSnapshot(`
            "CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
            }"
        `);
    });

    test("Returns entry with sort arg", () => {
        // @ts-ignore
        const mockedNeo4jGraphQL = jest.mocked(new Neo4jGraphQL(), true);
        const nodes = [
            // @ts-ignore
            new NodeBuilder({
                name: "Actor",
            }).instance(),
        ];
        // @ts-ignore
        const relationships = [
            // @ts-ignore
            {
                name: "MovieActorsRelationship",
                temporalFields: [],
                enumFields: [],
                computedFields: [],
                pointFields: [],
                primitiveFields: [],
                scalarFields: [],
            },
        ];

        // @ts-ignore
        mockedNeo4jGraphQL.nodes = nodes;
        // @ts-ignore
        mockedNeo4jGraphQL.relationships = relationships;

        const resolveTree: ResolveTree = {
            alias: "actorsConnection",
            name: "actorsConnection",
            args: {
                sort: [
                    {
                        node: {
                            name: "ASC",
                        },
                        edge: {
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
                queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                direction: "IN",
                // @ts-ignore
                typeMeta: {
                    name: "Actor",
                },
            },
        };

        // @ts-ignore
        const context: Context = { neoSchema: mockedNeo4jGraphQL, nodes, relationships };

        const entry = createConnectionAndParams({ resolveTree, field, context, nodeVariable: "this" });

        expect(entry[0]).toMatchInlineSnapshot(`
            "CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH this_acted_in_relationship, this_actor
            ORDER BY this_acted_in_relationship.screenTime DESC, this_actor.name ASC
            WITH collect({ screenTime: this_acted_in_relationship.screenTime }) AS edges
            UNWIND edges as edge
            WITH edges, edge
            ORDER BY edge.screenTime DESC, edge.node.name ASC
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS actorsConnection
            }"
        `);
    });

    test("Returns an entry with offset and limit args", () => {
        // @ts-ignore
        const mockedNeo4jGraphQL = jest.mocked(new Neo4jGraphQL(), true);
        // @ts-ignore
        const nodes = [
            // @ts-ignore
            new NodeBuilder({
                name: "Actor",
            }).instance(),
        ];
        // @ts-ignore
        const relationships = [
            // @ts-ignore
            {
                name: "MovieActorsRelationship",
                temporalFields: [],
                enumFields: [],
                computedFields: [],
                pointFields: [],
                primitiveFields: [],
                scalarFields: [],
            },
        ];

        // @ts-ignore
        mockedNeo4jGraphQL.nodes = nodes;
        // @ts-ignore
        mockedNeo4jGraphQL.relationships = relationships;

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
                queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
                direction: "IN",
                // @ts-ignore
                typeMeta: {
                    name: "Actor",
                },
            },
        };

        // @ts-ignore
        const context: Context = { neoSchema: mockedNeo4jGraphQL, nodes, relationships };

        const entry = createConnectionAndParams({ resolveTree, field, context, nodeVariable: "this" });

        expect(dedent(entry[0])).toEqual(dedent`CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
            WITH collect({ screenTime: this_acted_in_relationship.screenTime }) AS edges
            WITH size(edges) AS totalCount, edges[11..21] AS limitedSelection
            RETURN { edges: limitedSelection, totalCount: totalCount } AS actorsConnection
            }`);
    });
});
