/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
