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

import Node, { NodeConstructor } from "./Node";
import { NodeBuilder } from "../utils/test";

describe("Node", () => {
    test("should construct", () => {
        // @ts-ignore
        const input: NodeConstructor = {
            name: "Movie",
            cypherFields: [],
            enumFields: [],
            primitiveFields: [],
            scalarFields: [],
            temporalFields: [],
            unionFields: [],
            interfaceFields: [],
            objectFields: [],
            interfaces: [],
            otherDirectives: [],
            pointFields: [],
            relationFields: [],
        };

        // @ts-ignore
        expect(new Node(input)).toMatchObject({ name: "Movie" });
    });

    it("should return labelString from node name", () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        expect(node.getLabelString()).toEqual(":Movie");
    });

    it("should return labels from node name", () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        expect(node.getLabels()).toEqual(["Movie"]);
    });
});
