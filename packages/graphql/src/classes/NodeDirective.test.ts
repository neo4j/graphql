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
import { ContextBuilder } from "../../tests/utils/builders/context-builder";

describe("NodeDirective", () => {
    const defaultContext = new ContextBuilder().instance();

    test("should generate label string with only the input typename", () => {
        const instance = new NodeDirective({});
        const labelString = instance.getLabelsString("MyLabel", defaultContext);

        expect(labelString).toBe(":`MyLabel`");
    });

    test("should generate label string with directive label", () => {
        const instance = new NodeDirective({ label: "MyOtherLabel" });
        const labelString = instance.getLabelsString("MyLabel", defaultContext);

        expect(labelString).toBe(":`MyOtherLabel`");
    });

    test("should generate label string adding additional labels to input typename", () => {
        const instance = new NodeDirective({ additionalLabels: ["Label1", "Label2"] });
        const labelString = instance.getLabelsString("MyLabel", defaultContext);

        expect(labelString).toBe(":`MyLabel`:`Label1`:`Label2`");
    });

    test("should generate label string adding additional labels to directive label", () => {
        const instance = new NodeDirective({ label: "MyOtherLabel", additionalLabels: ["Label1", "Label2"] });
        const labelString = instance.getLabelsString("MyLabel", defaultContext);

        expect(labelString).toBe(":`MyOtherLabel`:`Label1`:`Label2`");
    });

    test("should throw an error if there are no labels", () => {
        const instance = new NodeDirective({});
        expect(() => {
            instance.getLabelsString("", defaultContext);
        }).toThrow();
    });

    test("should escape context labels", () => {
        const context = new ContextBuilder({ escapeTest1: "123-321", escapeTest2: "He`l`lo" }).instance();
        const instance = new NodeDirective({
            additionalLabels: ["$context.escapeTest1", "$context.escapeTest2"],
        });
        const labelString = instance.getLabelsString("label", context);
        expect(labelString).toBe(":`label`:`123-321`:`He``l``lo`");
    });

    test("should escape jwt labels", () => {
        const context = new ContextBuilder({ jwt: { escapeTest1: "123-321", escapeTest2: "He`l`lo" } }).instance();
        const instance = new NodeDirective({
            additionalLabels: ["$jwt.escapeTest1", "$jwt.escapeTest2"],
        });
        const labelString = instance.getLabelsString("label", context);
        expect(labelString).toBe(":`label`:`123-321`:`He``l``lo`");
    });

    test("should throw if jwt variable is missing in context", () => {
        const context = new ContextBuilder({}).instance();
        const instance = new NodeDirective({
            additionalLabels: ["$jwt.var1"],
        });
        expect(() => {
            instance.getLabelsString("label", context);
        }).toThrow("Type value required.");
    });

    test("should throw if context variable is missing in context", () => {
        const context = new ContextBuilder({}).instance();
        const instance = new NodeDirective({
            additionalLabels: ["$context.var1"],
        });
        expect(() => {
            instance.getLabelsString("label", context);
        }).toThrow("Type value required.");
    });
});
