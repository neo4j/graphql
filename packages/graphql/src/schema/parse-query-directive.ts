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
import { parseArguments } from "../schema-model/parser/parse-arguments";
import { QueryDirective } from "../classes/QueryDirective";
import { queryDirective as queryDirectiveDefinition } from "../graphql/directives/query";

function parseQueryDirective(directiveNode: DirectiveNode | undefined) {
    if (!directiveNode || directiveNode.name.value !== queryDirectiveDefinition.name) {
        throw new Error("Undefined or incorrect directive passed into parseQueryDirective function");
    }
    const arg = parseArguments(queryDirectiveDefinition, directiveNode) as ConstructorParameters<
        typeof QueryDirective
    >[0];

    return new QueryDirective(arg);
}

export default parseQueryDirective;
