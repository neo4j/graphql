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
import { DocumentValidationError } from "../utils/document-validation-error";
import { parseArgumentToInt } from "../utils/utils";

export function verifyLimit({ directiveNode }: { directiveNode: DirectiveNode }) {
    const defaultArg = directiveNode.arguments?.find((a) => a.name.value === "default");
    const maxArg = directiveNode.arguments?.find((a) => a.name.value === "max");
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
                `@limit.default invalid value: ${defaultValue}. Must be greater than 0.`,
                ["default"]
            );
        }
    }
    if (maxLimit) {
        const maxValue = maxLimit.toNumber();
        // max must be greater than 0
        if (maxValue <= 0) {
            throw new DocumentValidationError(`@limit.max invalid value: ${maxValue}. Must be greater than 0.`, [
                "max",
            ]);
        }
    }
    if (defaultLimit && maxLimit) {
        const defaultValue = defaultLimit.toNumber();
        const maxValue = maxLimit.toNumber();
        // default must be smaller than max
        if (maxLimit < defaultLimit) {
            throw new DocumentValidationError(
                `@limit.max invalid value: ${maxValue}. Must be greater than limit.default: ${defaultValue}.`,
                ["max"]
            );
        }
    }
}
