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
import { MutationDirective } from "../classes/MutationDirective";
import type { MutationOperations } from "../graphql/directives/mutation";
import { mutationDirective as mutationDirectiveDefinition } from "../graphql/directives/mutation";
import { parseArguments } from "../schema-model/parser/parse-arguments";

function parseMutationDirective(directiveNode: DirectiveNode | undefined) {
    if (!directiveNode || directiveNode.name.value !== mutationDirectiveDefinition.name) {
        throw new Error("Undefined or incorrect directive passed into parseMutationDirective function");
    }
    const arg = parseArguments<{
        operations: MutationOperations[];
    }>(mutationDirectiveDefinition, directiveNode);

    return new MutationDirective(arg.operations);
}

export default parseMutationDirective;
