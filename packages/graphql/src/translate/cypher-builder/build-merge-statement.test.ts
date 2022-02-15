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

import { dedent } from "graphql-compose";
import { Context } from "../../types";
import { buildMergeStatement } from "./build-merge-statement";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import { Node, Neo4jGraphQLCypherBuilderError } from "../../classes";
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";
import { RelationFieldBuilder } from "../../../tests/utils/builders/relation-field-builder";

describe("build merge statement", () => {
    let context: Context;
    let node: Node;

    beforeAll(() => {
        context = new ContextBuilder().instance();
        node = new NodeBuilder({
            name: "MyLabel",
        }).instance();
    });
    describe("node merge", () => {
        test("build simple merge node statement", () => {
            const statement = buildMergeStatement({
                sourceNode: {
                    varName: "this",
                    node,
                },
                context,
            });

            expect(statement[0]).toBe("MERGE (this:MyLabel)");
            expect(statement[1]).toEqual({});
        });

        test("build merge node statement with onCreate", () => {
            const statement = buildMergeStatement({
                sourceNode: {
                    varName: "this",
                    node,
                    onCreate: {
                        age: 23,
                        name: "Keanu",
                    },
                },
                context,
            });

            expect(dedent(statement[0])).toEqual(dedent`MERGE (this:MyLabel)
                ON CREATE
                SET
                this.age = $this_on_create_age,
                this.name = $this_on_create_name
            `);
            expect(statement[1]).toEqual({
                this_on_create_age: 23,
                this_on_create_name: "Keanu",
            });
        });
    });
    describe("relation merge", () => {
        test("build merge relation statement", () => {
            const relationField = new RelationFieldBuilder().instance();
            const statement = buildMergeStatement({
                sourceNode: {
                    varName: "this",
                },
                targetNode: {
                    varName: "that",
                },
                relationship: {
                    relationField,
                },
                context,
            });

            expect(statement[0]).toBe("MERGE (this)-[this_relationship_that]->(that)");
            expect(statement[1]).toEqual({});
        });

        test("build merge relation statement with onCreate", () => {
            const relationField = new RelationFieldBuilder().instance();
            const statement = buildMergeStatement({
                sourceNode: {
                    varName: "this",
                    node,
                    onCreate: {
                        age: 23,
                        name: "Keanu",
                    },
                },
                targetNode: {
                    varName: "that",
                },
                relationship: {
                    onCreate: {
                        screentime: 10,
                    },
                    relationField,
                },
                context,
            });

            expect(dedent(statement[0])).toEqual(dedent`MERGE (this:MyLabel)-[this_relationship_that]->(that)
                ON CREATE
                SET
                this.age = $this_on_create_age,
                this.name = $this_on_create_name
                this_relationship_that.screentime = $this_relationship_that_on_create_screentime
            `);
            expect(statement[1]).toEqual({
                this_on_create_age: 23,
                this_on_create_name: "Keanu",
                this_relationship_that_on_create_screentime: 10,
            });
        });

        test("build merge relation statement with onCreate and db alias", () => {
            const relationField = new RelationFieldBuilder().instance();
            const nodeWithAlias: Node = new NodeBuilder({
                name: "MyLabel2",
                primitiveFields: [
                    {
                        fieldName: "iri",
                        dbPropertyName: "uri",
                        typeMeta: {
                            name: "ID",
                            array: false,
                            required: true,
                            pretty: "ID!",
                            input: {
                                where: { type: "ID", pretty: "ID" },
                                create: { type: "ID", pretty: "ID!" },
                                update: { type: "ID", pretty: "ID" },
                            },
                            originalType: undefined,
                        },
                        otherDirectives: [],
                        arguments: [],
                    },
                    {
                        fieldName: "prefLabel",
                        dbPropertyName: "prefLabel",
                        typeMeta: {
                            name: "String",
                            array: true,
                            required: true,
                            pretty: "[String]!",
                            input: {
                                where: { type: "String", pretty: "[String]" },
                                create: { type: "String", pretty: "[String]!" },
                                update: { type: "String", pretty: "[String]" },
                            },
                            originalType: undefined,
                        },
                        otherDirectives: [],
                        arguments: [],
                    },
                ],
            }).instance();
            const statement = buildMergeStatement({
                sourceNode: {
                    varName: "this",
                    node: nodeWithAlias,
                    onCreate: { iri: "new-b", prefLabel: "cert" },
                },
                targetNode: {
                    varName: "that",
                },
                relationship: {
                    onCreate: {
                        screentime: 20,
                    },
                    relationField,
                },
                context,
            });

            expect(dedent(statement[0])).toEqual(dedent`MERGE (this:MyLabel2)-[this_relationship_that]->(that)
                ON CREATE
                SET
                this.uri = $this_on_create_uri,
                this.prefLabel = $this_on_create_prefLabel
                this_relationship_that.screentime = $this_relationship_that_on_create_screentime
            `);
            expect(statement[1]).toEqual({
                this_on_create_uri: "new-b",
                this_on_create_prefLabel: ["cert"],
                this_relationship_that_on_create_screentime: 20,
            });
        });

        test("throws if missing relation data", () => {
            const relationField = new RelationFieldBuilder().instance();
            /* eslint-disable @typescript-eslint/no-unsafe-argument */
            // This test is intended to check for unsafe arguments
            expect(() => {
                buildMergeStatement({
                    sourceNode: {
                        varName: "this",
                        node,
                        onCreate: {
                            age: 23,
                            name: "Keanu",
                        },
                    },
                    targetNode: {
                        varName: "that",
                    },
                    context,
                } as any);
            }).toThrow(Neo4jGraphQLCypherBuilderError);
            expect(() => {
                buildMergeStatement({
                    sourceNode: {
                        varName: "this",
                        node,
                        onCreate: {
                            age: 23,
                            name: "Keanu",
                        },
                    },
                    relationship: {
                        onCreate: {
                            screentime: 10,
                        },
                        relationField,
                    },
                    context,
                } as any);
            }).toThrow(Neo4jGraphQLCypherBuilderError);
            /* eslint-enable @typescript-eslint/no-unsafe-argument */
        });
    });
});
