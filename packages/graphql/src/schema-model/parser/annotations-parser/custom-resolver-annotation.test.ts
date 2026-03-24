/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { customResolverDirective } from "../../../graphql/directives";
import { parseCustomResolverAnnotation } from "./custom-resolver-annotation";

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
