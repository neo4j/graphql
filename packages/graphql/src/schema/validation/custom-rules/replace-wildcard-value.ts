/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { astFromValueUntyped } from "@graphql-tools/utils";
import type { ASTVisitor, GraphQLSchema, ObjectTypeDefinitionNode, TypeNode, ValueNode } from "graphql";
import { Kind } from "graphql";
import { getStandardJwtDefinition } from "../../../graphql/directives/type-dependant-directives/jwt-payload";

type DefaultValue = false | 0 | never[] | "" | null;

function getDefaultValueForTypename(typeName: string): DefaultValue {
    switch (typeName) {
        case "Boolean":
            return false;
        case "String":
            return "";
        case "Int":
        case "Float":
            return 0;
        case "List":
            return [];
        default:
            return null;
    }
}
function makeReplacementFieldNode(fieldType: TypeNode): ValueNode | null {
    let replacementValue: DefaultValue = null;
    if (fieldType.kind === Kind.NAMED_TYPE) {
        replacementValue = getDefaultValueForTypename(fieldType.name.value);
    }
    if (fieldType.kind === Kind.LIST_TYPE) {
        replacementValue = getDefaultValueForTypename("List");
    }
    return astFromValueUntyped(replacementValue);
}

export function makeReplaceWildcardVisitor({ jwt, schema }: { jwt?: ObjectTypeDefinitionNode; schema: GraphQLSchema }) {
    return function replaceWildcardValue(): ASTVisitor {
        return {
            ObjectField: {
                leave(node) {
                    if (node.value.kind !== Kind.STRING) {
                        return;
                    }
                    const fieldValue = node.value.value;
                    if (!fieldValue.includes("$jwt")) {
                        return;
                    }
                    const jwtFieldName = fieldValue.substring(5);
                    const jwtField =
                        jwt?.fields?.find((f) => f.name.value === jwtFieldName) ||
                        getStandardJwtDefinition(schema)?.fields?.find((f) => f.name.value === jwtFieldName);
                    if (jwtField) {
                        const fieldWithReplacedValue = makeReplacementFieldNode(jwtField.type) || node.value;
                        return { ...node, value: fieldWithReplacedValue };
                    }
                },
            },
        };
    };
}
