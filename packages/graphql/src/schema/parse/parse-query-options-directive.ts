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

import { DirectiveNode, ObjectFieldNode, ObjectTypeDefinitionNode, ObjectValueNode } from "graphql";
import * as neo4j from "neo4j-driver";
import { QueryOptionsDirective } from "../../classes/QueryOptionsDirective";
import { Neo4jGraphQLError } from "../../classes/Error";
import parseValueNode from "../parse-value-node";

export function parseQueryOptionsDirective({
    directive,
    definition,
}: {
    directive: DirectiveNode;
    definition: ObjectTypeDefinitionNode;
}): QueryOptionsDirective {
    const limitArgument = directive.arguments?.find((direc) => direc.name.value === "limit");
    const limitValue = limitArgument?.value as ObjectValueNode | undefined;
    const defaultLimitArgument = limitValue?.fields.find((field) => field.name.value === "default");
    const maxLimitArgument = limitValue?.fields.find((field) => field.name.value === "max");

    const defaultLimit = parseArgumentToInt(defaultLimitArgument);
    const maxLimit = parseArgumentToInt(maxLimitArgument);

    const queryOptionsLimit = { default: defaultLimit, max: maxLimit };
    validateLimitArguments(queryOptionsLimit, definition.name.value);

    return new QueryOptionsDirective({ limit: queryOptionsLimit });
}

function parseArgumentToInt(field: ObjectFieldNode | undefined): neo4j.Integer | undefined {
    if (field) {
        const parsed = parseValueNode(field.value) as number;
        return neo4j.int(parsed);
    }
    return undefined;
}

function validateLimitArguments(arg: QueryOptionsDirective["limit"], typeName: string): void {
    const maxLimit = arg.max?.toNumber();
    const defaultLimit = arg.default?.toNumber();

    if (defaultLimit !== undefined && defaultLimit <= 0) {
        throw new Neo4jGraphQLError(
            `${typeName} @queryOptions(limit: {default: ${defaultLimit}}) invalid value: '${defaultLimit}' try a number greater than 0`
        );
    }
    if (maxLimit !== undefined && maxLimit <= 0) {
        throw new Neo4jGraphQLError(
            `${typeName} @queryOptions(limit: {max: ${maxLimit}}) invalid value: '${maxLimit}' try a number greater than 0`
        );
    }
    if (maxLimit && defaultLimit) {
        if (maxLimit < defaultLimit) {
            throw new Neo4jGraphQLError(
                `${typeName} @queryOptions(limit: {max: ${maxLimit}, default: ${defaultLimit}}) invalid default value, 'default' must be smaller than 'max'`
            );
        }
    }
}
