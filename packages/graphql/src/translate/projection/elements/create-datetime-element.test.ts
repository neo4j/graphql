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
import { TemporalField } from "../../../types";
import { createDatetimeElement } from "./create-datetime-element";

describe("createDatetimeElement", () => {
    test("returns projection element for single datetime value", () => {
        const resolveTree: ResolveTree = {
            name: "datetime",
            alias: "datetime",
            args: {},
            fieldsByTypeName: {},
        };

        const field: TemporalField = {
            // @ts-ignore
            typeMeta: {
                name: "DateTime",
            },
        };

        const element = createDatetimeElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual(
            'datetime: apoc.date.convertFormat(toString(this.datetime), "iso_zoned_date_time", "iso_offset_date_time")'
        );
    });

    test("returns projection element for array of datetime values", () => {
        const resolveTree: ResolveTree = {
            name: "datetimes",
            alias: "datetimes",
            args: {},
            fieldsByTypeName: {},
        };

        const field: TemporalField = {
            // @ts-ignore
            typeMeta: {
                name: "DateTime",
                array: true,
            },
        };

        const element = createDatetimeElement({
            resolveTree,
            field,
            variable: "this",
        });

        expect(element).toEqual(
            'datetimes: [ dt in this.datetimes | apoc.date.convertFormat(toString(dt), "iso_zoned_date_time", "iso_offset_date_time") ]'
        );
    });
});
