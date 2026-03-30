/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { pluralDirective } from "../../../graphql/directives";
import { PluralAnnotation } from "../../annotation/PluralAnnotation";
import { parseArguments } from "../parse-arguments";

export function parsePluralAnnotation(directive: DirectiveNode): PluralAnnotation {
    const { value } = parseArguments<{ value: string }>(pluralDirective, directive);
    return new PluralAnnotation({
        value,
    });
}
