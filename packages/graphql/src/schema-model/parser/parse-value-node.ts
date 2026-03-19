/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind } from "graphql/language";
import type { ValueNode } from "graphql/language/ast";

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

