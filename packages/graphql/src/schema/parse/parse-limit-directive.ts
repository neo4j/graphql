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

import type { ArgumentNode, DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import * as neo4j from "neo4j-driver";
import { LimitDirective } from "../../classes/LimitDirective";
import { Neo4jGraphQLError } from "../../classes/Error";
import { parseValueNode } from "../../schema-model/parser/parse-value-node";

export function parseLimitDirective({
    directive,
    definition,
}: {
    directive: DirectiveNode;
    definition: ObjectTypeDefinitionNode;
}): LimitDirective {
    const defaultLimitArgument = directive.arguments?.find((argument) => argument.name.value === "default");
    const maxLimitArgument = directive.arguments?.find((argument) => argument.name.value === "max");

    const defaultLimit = parseArgumentToInt(defaultLimitArgument);
    const maxLimit = parseArgumentToInt(maxLimitArgument);

    const limit = { default: defaultLimit, max: maxLimit };

    const limitError = validateLimitArguments(limit, definition.name.value);
    if (limitError) {
        throw limitError;
    }

    return new LimitDirective(limit);
}

function parseArgumentToInt(argument: ArgumentNode | undefined): neo4j.Integer | undefined {
    if (argument) {
        const parsed = parseValueNode(argument.value) as number;
        return neo4j.int(parsed);
    }
    return undefined;
}

function validateLimitArguments(
    arg: { default: neo4j.Integer | undefined; max: neo4j.Integer | undefined },
    typeName: string
): Neo4jGraphQLError | undefined {
    const maxLimit = arg.max?.toNumber();
    const defaultLimit = arg.default?.toNumber();

    if (defaultLimit !== undefined && defaultLimit <= 0) {
        return new Neo4jGraphQLError(
            `${typeName} @limit(default: ${defaultLimit}) invalid value: '${defaultLimit}', it should be a number greater than 0`
        );
    }
    if (maxLimit !== undefined && maxLimit <= 0) {
        return new Neo4jGraphQLError(
            `${typeName} @limit(max: ${maxLimit}) invalid value: '${maxLimit}', it should be a number greater than 0`
        );
    }
    if (maxLimit && defaultLimit) {
        if (maxLimit < defaultLimit) {
            return new Neo4jGraphQLError(
                `${typeName} @limit(max: ${maxLimit}, default: ${defaultLimit}) invalid default value, 'default' must be smaller than 'max'`
            );
        }
    }
    return undefined;
}
