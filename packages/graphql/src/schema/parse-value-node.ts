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

import { ValueNode, ObjectValueNode } from "graphql/language/ast";
import { Kind } from "graphql/language";

function valueOfObjectValueNode(ast: ObjectValueNode) {
    return Object.values(ast.fields).reduce((a, b) => {
        a[b.name.value] = parseValueNode(b.value);

        return a;
    }, {});
}

function parseValueNode(ast: ValueNode): any {
    let result: any;

    switch (ast.kind) {
        case Kind.ENUM:
        case Kind.STRING:
            result = ast.value;
            break;

        case Kind.INT:
        case Kind.FLOAT:
            result = Number(ast.value);
            break;

        case Kind.BOOLEAN:
            result = Boolean(ast.value);
            break;
        case Kind.NULL:
            break;
        case Kind.LIST:
            result = ast.values.map(parseValueNode);
            break;
        case Kind.OBJECT:
            result = valueOfObjectValueNode(ast);
            break;
        default:
            throw new Error(`invalid Kind: ${ast.kind}`);
    }

    return result;
}

export default parseValueNode;
