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

import type { ValueNode } from "graphql/language/ast";
import { Kind } from "graphql/language";

export function parseValueNode(ast: ValueNode): any {
    switch (ast.kind) {
        case Kind.ENUM:
        case Kind.STRING:
        case Kind.BOOLEAN:
            return ast.value;
        case Kind.INT:
        case Kind.FLOAT:
            return Number(ast.value);
        case Kind.NULL:
            return null;
        case Kind.LIST:
            return ast.values.map(parseValueNode);
        case Kind.OBJECT:
            return ast.fields.reduce((a, b) => {
                a[b.name.value] = parseValueNode(b.value);
                return a;
            }, {});
        default:
            throw new Error(`invalid Kind: ${ast.kind}`);
    }
}

