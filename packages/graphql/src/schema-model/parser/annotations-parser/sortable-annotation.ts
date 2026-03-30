/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { sortableDirective } from "../../../graphql/directives";
import { SortableAnnotation } from "../../annotation/SortableAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseSortableAnnotation(directive: DirectiveNode): SortableAnnotation {
    const { byValue } = parseArguments<{
        byValue: boolean;
    }>(sortableDirective, directive);

    return new SortableAnnotation({
        byValue,
    });
}
