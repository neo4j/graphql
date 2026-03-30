/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { jwtClaim } from "../../../graphql/directives";
import { JWTClaimAnnotation } from "../../annotation/JWTClaimAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseJWTClaimAnnotation(directive: DirectiveNode): JWTClaimAnnotation {
    const { path } = parseArguments<{ path: string }>(jwtClaim, directive);

    return new JWTClaimAnnotation({
        path,
    });
}
