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

import { DirectiveNode, ObjectTypeDefinitionNode, ObjectValueNode } from "graphql";
import * as neo4j from "neo4j-driver";
import { QueryOptions } from "../../types";
import parseValueNode from "../parse-value-node";

function parseQueryOptionsDirective({
    directive,
    definition,
}: {
    directive: DirectiveNode;
    definition: ObjectTypeDefinitionNode;
}): QueryOptions {
    const limitArgument = directive.arguments?.find((direc) => direc.name.value === "limit");
    const limitValue = limitArgument?.value as ObjectValueNode | undefined;
    const defaultLimitArgument = limitValue?.fields.find((field) => field.name.value === "default");

    let defaultLimit: neo4j.Integer | undefined;
    if (defaultLimitArgument) {
        const parsed = parseValueNode(defaultLimitArgument.value) as number;

        if (parsed <= 0) {
            throw new Error(
                `${definition.name.value} @queryOptions(limit: {default: ${parsed}}) invalid value: '${parsed}' try a number greater than 0`
            );
        }

        defaultLimit = neo4j.int(parsed);
    }

    return {
        limit: { default: defaultLimit },
    };
}

export default parseQueryOptionsDirective;
