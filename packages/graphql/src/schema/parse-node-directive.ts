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

import { DirectiveNode, FieldDefinitionNode, ObjectTypeDefinitionNode, valueFromASTUntyped } from "graphql";
import { NodeDirective } from "../classes/NodeDirective";

function parseNodeDirective(nodeDirective: DirectiveNode | undefined, definition: ObjectTypeDefinitionNode) {
    if (!nodeDirective || nodeDirective.name.value !== "node") {
        throw new Error("Undefined or incorrect directive passed into parseNodeDirective function");
    }

    const global = getArgumentValue<boolean>(nodeDirective, "global");

    return new NodeDirective({
        global,
        globalIdField: global ? getGlobalIdField(definition) : undefined,
        label: getArgumentValue<string>(nodeDirective, "label"),
        additionalLabels: getArgumentValue<string[]>(nodeDirective, "additionalLabels"),
        plural: getArgumentValue<string>(nodeDirective, "plural"),
    });
}

function getArgumentValue<T>(directive: DirectiveNode, name: string): T | undefined {
    const argument = directive.arguments?.find((a) => a.name.value === name);
    return argument ? (valueFromASTUntyped(argument.value) as T) : undefined;
}

function alphabeticallySortFields(fields: FieldDefinitionNode[]): FieldDefinitionNode[] {
    return fields.sort((a, b) => (a.name.value > b.name.value ? 1 : -1));
}

function getGlobalIdField(definition: ObjectTypeDefinitionNode): string | undefined {
    const fields = alphabeticallySortFields([...(definition.fields ?? [])]);

    if (fields.find((x) => x.name.value === "id")) {
        throw new Error(
            `Type ${definition.name.value} already has a field "id." Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field`
        );
    }

    const candidates = fields.filter(
        (x) =>
            x.type.kind === "NonNullType" &&
            x.type.type.kind === "NamedType" &&
            (x.type.type.name.value === "ID" || x.type.type.name.value === "String")
    );

    const idDirectiveField = candidates.find((x) => x.directives?.find((dir) => dir.name.value === "id"));
    const uniqueDirectiveField = candidates.find((x) => x.directives?.find((dir) => dir.name.value === "unique"));

    let fieldName: string | undefined;

    if (idDirectiveField) {
        fieldName = idDirectiveField.name.value;
    } else if (uniqueDirectiveField) {
        fieldName = uniqueDirectiveField.name.value;
    }

    if (!fieldName) {
        throw new Error(
            "The `global` flag on the `@node` directive requires at least one field with the `@id` or `@unique` directive"
        );
    }
    return fieldName;
}

export default parseNodeDirective;
