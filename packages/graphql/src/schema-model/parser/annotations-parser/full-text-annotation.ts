/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { fulltextDirective } from "../../../graphql/directives";
import { FulltextAnnotation, type FulltextField } from "../../annotation/FulltextAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseFulltextAnnotation(directive: DirectiveNode): FulltextAnnotation {
    const { indexes } = parseArguments<{ indexes: FulltextField[] }>(fulltextDirective, directive);

    return new FulltextAnnotation({
        indexes,
    });
}
