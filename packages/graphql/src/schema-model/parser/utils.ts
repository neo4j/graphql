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
import type { DirectiveNode, ValueNode } from "graphql";
import { Kind } from "graphql";

export function parseArguments(directive: DirectiveNode): Record<string, unknown> {
    return (directive.arguments || [])?.reduce((acc, argument) => {
        acc[argument.name.value] = getArgumentValueByType(argument.value);
        return acc;
    }, {});
}

function getArgumentValueByType(argumentValue: ValueNode): unknown {
    switch (argumentValue.kind) {
        case Kind.STRING:
        case Kind.INT:
        case Kind.FLOAT:
        case Kind.BOOLEAN:
        case Kind.ENUM:
            return argumentValue.value;
        case Kind.NULL:
            return null;
        case Kind.LIST:
            return argumentValue.values.map((v) => getArgumentValueByType(v));
        case Kind.OBJECT: {
            return argumentValue.fields.reduce((acc, field) => {
                acc[field.name.value] = getArgumentValueByType(field.value);
                return acc;
            }, {});
        }
    }
}
