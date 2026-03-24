/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { populatedByDirective } from "../../../graphql/directives";
import { PopulatedByAnnotation } from "../../annotation/PopulatedByAnnotation";
import { parseArguments } from "../parse-arguments";

export function parsePopulatedByAnnotation(directive: DirectiveNode): PopulatedByAnnotation {
    const { callback, operations } = parseArguments<{
        callback: string;
        operations: string[];
    }>(populatedByDirective, directive);

    return new PopulatedByAnnotation({
        callback,
        operations,
    });
}
