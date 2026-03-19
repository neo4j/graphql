/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DirectiveNode } from "graphql";
import type { DefaultAnnotationValue } from "../../annotation/DefaultAnnotation";
import { DefaultAnnotation } from "../../annotation/DefaultAnnotation";
import { parseArgumentsFromUnknownDirective } from "../parse-arguments";

export function parseDefaultAnnotation(directive: DirectiveNode): DefaultAnnotation {
    const args = parseArgumentsFromUnknownDirective(directive) as Record<string, DefaultAnnotationValue>;

    if (args.value === undefined) {
        throw new Error("@default directive must have a value");
    }

    return new DefaultAnnotation({
        value: args.value,
    });
}
