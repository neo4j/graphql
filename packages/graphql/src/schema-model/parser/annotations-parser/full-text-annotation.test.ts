/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { fulltextDirective } from "../../../graphql/directives";
import { parseFulltextAnnotation } from "./full-text-annotation";

describe("parseFullTextAnnotation", () => {
    it("should parse correctly", () => {
        const directive: DirectiveNode = makeDirectiveNode(
            "fullText",
            { indexes: [{ indexName: "ProductName", queryName: "productFullText", fields: ["name"] }] },
            fulltextDirective
        );
        const fullTextAnnotation = parseFulltextAnnotation(directive);
        expect(fullTextAnnotation).toEqual({
            name: "fulltext",
            indexes: [
                {
                    fields: ["name"],
                    indexName: "ProductName",
                    queryName: "productFullText",
                },
            ],
        });
    });
});
