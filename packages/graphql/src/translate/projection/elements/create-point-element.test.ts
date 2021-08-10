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
import { PointField } from "../../../types";
import createPointElement from "./create-point-element";

describe("createPointElement", () => {
    test("returns projection element for single point value", () => {
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

        const field: PointField = {
            // @ts-ignore
            typeMeta: {
                name: "Point",
            },
        };

        const element = createPointElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual("point: { point: this.point, crs: this.point.crs }");
    });

    test("returns projection element for array of point values", () => {
        const resolveTree: ResolveTree = {
            name: "points",
            alias: "points",
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

        const field: PointField = {
            // @ts-ignore
            typeMeta: {
                name: "Point",
                array: true,
            },
        };

        const element = createPointElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual("points: [p in this.points | { point:p, crs: p.crs }]");
    });
});
