/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../../classes";
import { mutationDirective } from "../../../graphql/directives";
import type { MutationOperations } from "../../../graphql/directives/mutation";
import { MutationAnnotation } from "../../annotation/MutationAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseMutationAnnotation(directive: DirectiveNode): MutationAnnotation {
    const { operations } = parseArguments(mutationDirective, directive);
    if (!Array.isArray(operations)) {
        throw new Neo4jGraphQLSchemaValidationError("@mutation operations must be an array");
    }
    return new MutationAnnotation({
        operations: new Set<MutationOperations>(operations),
    });
}
