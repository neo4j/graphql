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

import type { Maybe } from "@graphql-tools/utils";
import type { ASTVisitor, DocumentNode, GraphQLError, GraphQLSchema } from "graphql";
import { visit, visitInParallel } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import type { Neo4jGraphQLCallbacks } from "../../types";
import { Neo4jValidationContext } from "./Neo4jValidationContext";
import { mapError } from "./utils/map-error";

type Neo4jValidationRule = <T extends SDLValidationContext>(context: T) => ASTVisitor;

export function validateSDL(
    documentAST: DocumentNode,
    rules: ReadonlyArray<Neo4jValidationRule>,
    schemaToExtend?: Maybe<GraphQLSchema>,
    callbacks?: Neo4jGraphQLCallbacks
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new Neo4jValidationContext(
        documentAST,
        schemaToExtend,
        (error) => {
            const mappedError = mapError(error);
            errors.push(mappedError);
        },
        callbacks
    );
    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}
