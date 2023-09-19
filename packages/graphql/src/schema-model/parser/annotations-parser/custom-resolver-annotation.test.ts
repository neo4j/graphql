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
import { parseCustomResolverAnnotation } from "./custom-resolver-annotation";
import { customResolverDirective } from "../../../graphql/directives";

describe("parseCustomResolverAnnotation", () => {
    it("should parse correctly", () => {
        const directive: DirectiveNode = makeDirectiveNode(
            "customResolver",
            { requires: "firstName lastName" },
            customResolverDirective
        );
        const customResolverAnnotation = parseCustomResolverAnnotation(directive);
        expect(customResolverAnnotation.requires).toBe("firstName lastName");
    });

    it("should parse fields with multiple spaces correctly", () => {
        const directive: DirectiveNode = makeDirectiveNode(
            "customResolver",
            { requires: "firstName lastName" },
            customResolverDirective
        );
        const customResolverAnnotation = parseCustomResolverAnnotation(directive);
        expect(customResolverAnnotation.requires).toBe("firstName lastName");
    });
});
