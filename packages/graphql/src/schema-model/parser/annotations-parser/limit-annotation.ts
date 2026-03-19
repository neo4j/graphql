/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DirectiveNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../../classes";
import { limitDirective } from "../../../graphql/directives";
import { LimitAnnotation } from "../../annotation/LimitAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseLimitAnnotation(directive: DirectiveNode): LimitAnnotation {
    const { default: _default, max } = parseArguments<{
        default?: number;
        max?: number;
        resolvable: boolean;
    }>(limitDirective, directive);
    if (_default && typeof _default !== "number") {
        throw new Neo4jGraphQLSchemaValidationError(`@limit default must be a number`);
    }

    if (max && typeof max !== "number") {
        throw new Neo4jGraphQLSchemaValidationError(`@limit max must be a number`);
    }

    return new LimitAnnotation({
        default: _default,
        max,
    });
}
