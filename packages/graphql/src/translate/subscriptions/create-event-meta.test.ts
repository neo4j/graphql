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

import { createEventMeta } from "./create-event-meta";

describe("createEventMeta", () => {
    test("create", () => {
        expect(createEventMeta({ event: "create", nodeVariable: "this0" })).toBe(
            `WITH this0, { event: "create", id: id(this0), properties: { old: null, new: this0 { .* } }, timestamp: timestamp() } AS this0_meta`
        );
    });

    test("update", () => {
        expect(createEventMeta({ event: "update", nodeVariable: "this" })).toBe(
            `WITH this, { event: "update", id: id(this), properties: { old: this { .* }, new: this { .* } }, timestamp: timestamp() } AS this_meta`
        );
    });

    test("delete", () => {
        expect(createEventMeta({ event: "delete", nodeVariable: "this" })).toBe(
            `WITH this, { event: "delete", id: id(this), properties: { old: this { .* }, new: null }, timestamp: timestamp() } AS this_meta`
        );
    });
});
