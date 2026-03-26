/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { timestampDirective } from "../../../graphql/directives";
import { TimestampAnnotation } from "../../annotation/TimestampAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseTimestampAnnotation(directive: DirectiveNode): TimestampAnnotation {
    const { operations } = parseArguments<{ operations: string[] }>(timestampDirective, directive);

    if (operations.length === 0) {
        operations.push("CREATE", "UPDATE");
    }

    return new TimestampAnnotation({
        operations,
    });
}
