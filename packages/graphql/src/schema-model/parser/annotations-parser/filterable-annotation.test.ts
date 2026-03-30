/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { filterableDirective } from "../../../graphql/directives";
import { parseFilterableAnnotation } from "./filterable-annotation";

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
