/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import type { GraphQLWhereArg } from "../../../types";
import type { AuthenticationOperation } from "../../annotation/AuthenticationAnnotation";
import { AuthenticationAnnotation } from "../../annotation/AuthenticationAnnotation";
import { parseArgumentsFromUnknownDirective } from "../parse-arguments";

const authenticationDefaultOperations: AuthenticationOperation[] = [
    "READ",
    "AGGREGATE",
    "CREATE",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
    "SUBSCRIBE",
];
export function parseAuthenticationAnnotation(directive: DirectiveNode): AuthenticationAnnotation {
    const args = parseArgumentsFromUnknownDirective(directive) as {
        operations?: AuthenticationOperation[];
        jwt?: GraphQLWhereArg;
    };

    const constructorArgs: [AuthenticationOperation[], GraphQLWhereArg?] = [
        args.operations || authenticationDefaultOperations,
    ];
    if (args.jwt) {
        constructorArgs.push(args.jwt);
    }

    return new AuthenticationAnnotation(...constructorArgs);
}
