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

import type { Maybe } from "@graphql-tools/utils/typings/types";
import type { DocumentNode, GraphQLError, GraphQLSchema } from "graphql";
import { visit, visitInParallel } from "graphql";
import type { SDLValidationRule } from "graphql/validation/ValidationContext";
import { SDLValidationContext } from "graphql/validation/ValidationContext";


export function validateSDL(
    documentAST: DocumentNode,
    rules: ReadonlyArray<SDLValidationRule>,
    schemaToExtend?: Maybe<GraphQLSchema>
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new SDLValidationContext(documentAST, schemaToExtend, (error) => {
        errors.push(error);
    });
    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}
