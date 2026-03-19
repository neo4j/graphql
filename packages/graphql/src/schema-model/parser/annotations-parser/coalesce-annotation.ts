/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DirectiveNode } from "graphql";
import type { CoalesceAnnotationValue } from "../../annotation/CoalesceAnnotation";
import { CoalesceAnnotation } from "../../annotation/CoalesceAnnotation";
import { parseArgumentsFromUnknownDirective } from "../parse-arguments";

export function parseCoalesceAnnotation(directive: DirectiveNode): CoalesceAnnotation {
    const args = parseArgumentsFromUnknownDirective(directive) as Record<string, CoalesceAnnotationValue>;

    if (!args || args.value === undefined) {
        throw new Error("@coalesce directive must have a value");
    }

    return new CoalesceAnnotation({
        value: args.value,
    });
}
