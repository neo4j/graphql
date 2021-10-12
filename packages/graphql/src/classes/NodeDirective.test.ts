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

import { NodeDirective } from "./NodeDirective";

describe("NodeDirective", () => {
    test("should generate label string with only the input typename", () => {
        const instance = new NodeDirective({});
        const labelString = instance.getLabelsString("MyLabel");

        expect(labelString).toEqual(":MyLabel");
    });

    test("should generate label string with directive label", () => {
        const instance = new NodeDirective({ label: "MyOtherLabel" });
        const labelString = instance.getLabelsString("MyLabel");

        expect(labelString).toEqual(":MyOtherLabel");
    });

    test("should generate label string adding additional labels to input typename", () => {
        const instance = new NodeDirective({ additionalLabels: ["Label1", "Label2"] });
        const labelString = instance.getLabelsString("MyLabel");

        expect(labelString).toEqual(":MyLabel:Label1:Label2");
    });

    test("should generate label string adding additional labels to directive label", () => {
        const instance = new NodeDirective({ label: "MyOtherLabel", additionalLabels: ["Label1", "Label2"] });
        const labelString = instance.getLabelsString("MyLabel");

        expect(labelString).toEqual(":MyOtherLabel:Label1:Label2");
    });

    test("should throw an error if there are no labels", () => {
        const instance = new NodeDirective({});

        expect(() => {
            instance.getLabelsString("");
        }).toThrow();
    });
});
