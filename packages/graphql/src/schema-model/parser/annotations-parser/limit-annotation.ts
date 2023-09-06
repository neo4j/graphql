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
