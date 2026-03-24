/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { populatedByDirective } from "../../../graphql/directives";
import { parsePopulatedByAnnotation } from "./populated-by-annotation";

describe("parsePopulatedByAnnotation", () => {
    it("should parse correctly", () => {
        const directive: DirectiveNode = makeDirectiveNode("populatedBy", {
            callback: "callback",
            operations: ["CREATE", "UPDATE"],
        }, populatedByDirective);
        const populatedByAnnotation = parsePopulatedByAnnotation(directive);
        expect(populatedByAnnotation.callback).toBe("callback");
        expect(populatedByAnnotation.operations).toEqual(["CREATE", "UPDATE"]);
    });
});
