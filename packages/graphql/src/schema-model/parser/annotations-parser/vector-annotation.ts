/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { vectorDirective } from "../../../graphql/directives";
import type { VectorField } from "../../annotation/VectorAnnotation";
import { VectorAnnotation } from "../../annotation/VectorAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseVectorAnnotation(directive: DirectiveNode): VectorAnnotation {
    const { indexes } = parseArguments<{ indexes: VectorField[] }>(vectorDirective, directive);

    return new VectorAnnotation({
        indexes,
    });
}
