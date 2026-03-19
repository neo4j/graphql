/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { filterableDirective } from "../../../graphql/directives";
import { FilterableAnnotation } from "../../annotation/FilterableAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseFilterableAnnotation(directive: DirectiveNode): FilterableAnnotation {
    const { byValue, byAggregate } = parseArguments<{
        byValue: boolean;
        byAggregate: boolean;
    }>(filterableDirective, directive);

    return new FilterableAnnotation({
        byAggregate,
        byValue,
    });
}
