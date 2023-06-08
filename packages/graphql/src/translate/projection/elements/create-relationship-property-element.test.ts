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

import Cypher from "@neo4j/cypher-builder";
import type { ResolveTree } from "graphql-parse-resolve-info";
import Relationship from "../../../classes/Relationship";
import type { TemporalField, PointField, PrimitiveField } from "../../../types";
import { createRelationshipPropertyElement } from "./create-relationship-property-element";
import { compileCypher } from "../../../utils/compile-cypher";

describe("createRelationshipPropertyElement", () => {
    let relationship: Relationship;

    beforeAll(() => {
        relationship = new Relationship({
            name: "TestRelationship",
            type: "TEST_RELATIONSHIP",
            primitiveFields: [
                {
                    fieldName: "int",
                    typeMeta: {
                        name: "Int",
                        array: false,
                        required: true,
                        pretty: "Int!",
                        arrayTypePretty: "",
                        input: {
                            create: {
                                type: "Int",
                                pretty: "Int!",
                            },
                            update: {
                                type: "Int",
                                pretty: "Int",
                            },
                            where: {
                                type: "Int",
                                pretty: "Int",
                            },
                        },
                    },
                    selectableOptions: {
                        onRead: true,
                        onAggregate: false,
                    },
                    settableOptions: {
                        onCreate: true,
                        onUpdate: true,
                    },
                    otherDirectives: [],
                    arguments: [],
                    description: undefined,
                    readonly: false,
                    writeonly: false,
                } as PrimitiveField,
            ],
            pointFields: [
                {
                    fieldName: "point",
                    typeMeta: {
                        name: "Point",
                        array: false,
                        required: true,
                        pretty: "Point!",
                        arrayTypePretty: "",
                        input: {
                            create: {
                                type: "Point",
                                pretty: "PointInput!",
                            },
                            update: {
                                type: "Point",
                                pretty: "PointInput",
                            },
                            where: {
                                type: "PointInput",
                                pretty: "PointInput",
                            },
                        },
                    },
                    selectableOptions: {
                        onRead: true,
                        onAggregate: false,
                    },
                    settableOptions: {
                        onCreate: true,
                        onUpdate: true,
                    },
                    otherDirectives: [],
                    arguments: [],
                    description: undefined,
                    readonly: false,
                    writeonly: false,
                } as PointField,
            ],
            temporalFields: [
                {
                    fieldName: "datetime",
                    typeMeta: {
                        name: "DateTime",
                        array: false,
                        required: true,
                        pretty: "DateTime!",
                        arrayTypePretty: "",
                        input: {
                            create: {
                                type: "DateTime",
                                pretty: "DateTime!",
                            },
                            update: {
                                type: "DateTime",
                                pretty: "DateTime",
                            },
                            where: {
                                type: "DateTime",
                                pretty: "DateTime",
                            },
                        },
                    },
                    selectableOptions: {
                        onRead: true,
                        onAggregate: false,
                    },
                    settableOptions: {
                        onCreate: true,
                        onUpdate: true,
                    },
                    otherDirectives: [],
                    arguments: [],
                    description: undefined,
                    readonly: false,
                    writeonly: false,
                } as TemporalField,
            ],
        });
    });

    test("returns an element for a primitive property", () => {
        const resolveTree: ResolveTree = {
            alias: "int",
            name: "int",
            args: {},
            fieldsByTypeName: {},
        };

        const element = createRelationshipPropertyElement({ resolveTree, relationship, relationshipVariable: "this" });
        new Cypher.RawCypher((env) => {
            expect(compileCypher(element, env)).toBe("int: this.int");
            return "";
        }).build();
    });

    test("returns an element for a datetime property", () => {
        const resolveTree: ResolveTree = {
            alias: "datetime",
            name: "datetime",
            args: {},
            fieldsByTypeName: {},
        };

        const element = createRelationshipPropertyElement({ resolveTree, relationship, relationshipVariable: "this" });
        new Cypher.RawCypher((env) => {
            expect(compileCypher(element, env)).toBe(
                'datetime: apoc.date.convertFormat(toString(this.datetime), "iso_zoned_date_time", "iso_offset_date_time")'
            );
            return "";
        }).build();
    });

    test("returns an element for a point property", () => {
        const resolveTree: ResolveTree = {
            name: "point",
            alias: "point",
            args: {},
            fieldsByTypeName: {
                Point: {
                    crs: {
                        alias: "crs",
                        name: "crs",
                        args: {},
                        fieldsByTypeName: {},
                    },
                    point: {
                        alias: "point",
                        name: "point",
                        args: {},
                        fieldsByTypeName: {},
                    },
                },
            },
        };

        const element = createRelationshipPropertyElement({ resolveTree, relationship, relationshipVariable: "this" });
        new Cypher.RawCypher((env) => {
            expect(compileCypher(element, env)).toMatchInlineSnapshot(`
            "point: (CASE
                WHEN this.point IS NOT NULL THEN { point: this.point, crs: this.point.crs }
                ELSE NULL
            END)"
        `);
            return "";
        }).build();
    });
});
