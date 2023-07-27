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
import { Kind } from "graphql";
import { parseArgumentToInt } from "../utils/utils";
import { DocumentValidationError } from "../utils/document-validation-error";

export function verifyQueryOptions({ directiveNode }: { directiveNode: DirectiveNode }) {
    const limitArg = directiveNode.arguments?.find((a) => a.name.value === "limit");
    if (!limitArg) {
        // nothing to check, argument is optional
        return;
    }
    if (limitArg.value.kind !== Kind.OBJECT) {
        // delegate to DirectiveArgumentOfCorrectType rule
        return;
    }
    const defaultArg = limitArg.value.fields.find((f) => f.name.value === "default");
    const maxArg = limitArg.value.fields.find((f) => f.name.value === "max");
    if (!defaultArg && !maxArg) {
        // nothing to check, fields are optional
        return;
    }
    const defaultLimit = parseArgumentToInt(defaultArg);
    const maxLimit = parseArgumentToInt(maxArg);
    if (defaultLimit) {
        const defaultValue = defaultLimit.toNumber();
        // default must be greater than 0
        if (defaultValue <= 0) {
            throw new DocumentValidationError(
                `@queryOptions.limit.default invalid value: ${defaultValue}. Must be greater than 0.`,
                ["limit"]
            );
        }
    }
    if (maxLimit) {
        const maxValue = maxLimit.toNumber();
        // max must be greater than 0
        if (maxValue <= 0) {
            throw new DocumentValidationError(
                `@queryOptions.limit.max invalid value: ${maxValue}. Must be greater than 0.`,
                ["limit"]
            );
        }
    }
    if (defaultLimit && maxLimit) {
        const defaultValue = defaultLimit.toNumber();
        const maxValue = maxLimit.toNumber();
        // default must be smaller than max
        if (maxLimit < defaultLimit) {
            throw new DocumentValidationError(
                `@queryOptions.limit.max invalid value: ${maxValue}. Must be greater than limit.default: ${defaultValue}.`,
                ["limit"]
            );
        }
    }
}
