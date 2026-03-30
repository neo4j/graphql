/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { pluralDirective } from "../../../graphql/directives";
import { parsePluralAnnotation } from "./plural-annotation";

describe("parsePluralAnnotation", () => {
    it("should parse correctly", () => {
        const directive: DirectiveNode = makeDirectiveNode("Plural", { value: "myPluralString" }, pluralDirective);
        const pluralAnnotation = parsePluralAnnotation(directive);
        expect(pluralAnnotation.value).toBe("myPluralString");
    });
});
