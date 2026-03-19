/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { customResolverDirective } from "../../../graphql/directives";
import { CustomResolverAnnotation } from "../../annotation/CustomResolverAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseCustomResolverAnnotation(directive: DirectiveNode): CustomResolverAnnotation {
    const { requires } = parseArguments<{ requires: string | undefined }>(customResolverDirective, directive);
    return new CustomResolverAnnotation({
        requires,
    });
}
