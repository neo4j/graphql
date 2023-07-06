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
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import { QueryOptionsAnnotation } from "../annotation/QueryOptionsAnnotation";
import { parseArguments } from "./utils";

export function parseQueryOptionsAnnotation(directive: DirectiveNode): QueryOptionsAnnotation {
    const { limit } = parseArguments(directive) as {
        limit: {
            default?: string;
            max?: string;
        };
        resolvable: boolean;
    };

    const parsedLimit = {
        default: limit.default ? parseInt(limit.default) : undefined,
        max: limit.max ? parseInt(limit.max) : undefined,
    };

    if (parsedLimit.default && typeof parsedLimit.default !== "number") {
        throw new Neo4jGraphQLSchemaValidationError(`@queryOptions limit.default must be a number`);
    }

    if (parsedLimit.max && typeof parsedLimit.max !== "number") {
        throw new Neo4jGraphQLSchemaValidationError(`@queryOptions limit.max must be a number`);
    }

    return new QueryOptionsAnnotation({
        limit: parsedLimit,
    });
}
