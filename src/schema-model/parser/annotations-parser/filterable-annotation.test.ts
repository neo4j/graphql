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

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { parseFilterableAnnotation } from "./filterable-annotation";
import { filterableDirective } from "../../../graphql/directives";

describe("parseFilterableAnnotation", () => {
    it("should parse correctly when byValue is set to true and byAggregate is set to false", () => {
        const directive: DirectiveNode = makeDirectiveNode("filterable", { byValue: true, byAggregate: false }, filterableDirective);
        const filterableAnnotation = parseFilterableAnnotation(directive);
        expect(filterableAnnotation.byValue).toBe(true);
        expect(filterableAnnotation.byAggregate).toBe(false);
    });
    it("should parse correctly when byValue is set to false and byAggregate is set to true", () => {
        const directive: DirectiveNode = makeDirectiveNode("filterable", { byValue: false, byAggregate: true }, filterableDirective);
        const filterableAnnotation = parseFilterableAnnotation(directive);
        expect(filterableAnnotation.byValue).toBe(false);
        expect(filterableAnnotation.byAggregate).toBe(true);
    });
});
