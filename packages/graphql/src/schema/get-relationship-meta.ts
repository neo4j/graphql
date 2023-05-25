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

import type { ArgumentNode, FieldDefinitionNode, StringValueNode } from "graphql";
import { Kind } from "graphql";
import { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../constants";
import { defaultNestedOperations } from "../graphql/directives/relationship";

type RelationshipDirection = "IN" | "OUT";

type RelationshipMeta = {
    direction: RelationshipDirection;
    type: string;
    properties?: string;
    queryDirection: RelationshipQueryDirectionOption;
    nestedOperations: RelationshipNestedOperationsOption[];
};

function getRelationshipMeta(
    field: FieldDefinitionNode,
    interfaceField?: FieldDefinitionNode
): RelationshipMeta | undefined {
    const directive =
        field.directives?.find((x) => x.name.value === "relationship") ||
        interfaceField?.directives?.find((x) => x.name.value === "relationship");
    if (!directive) {
        return undefined;
    }

    if (!directive.arguments) {
        throw new Error("@relationship has no arguments");
    }

    // Fail earlier if required arguments are missing: direction, type
    const direction = getDirection(directive.arguments);
    const type = getType(directive.arguments);

    // Optional arguments
    const queryDirection = getQueryDirection(directive.arguments);
    const properties = getProperties(directive.arguments);
    const nestedOperations = getNestedOperations(directive.arguments);

    return {
        direction,
        type,
        properties,
        queryDirection,
        nestedOperations,
    };
}

function getType(directiveArguments: Readonly<ArgumentNode[]>) {
    const typeArg = directiveArguments.find((x) => x.name.value === "type");
    if (!typeArg) {
        throw new Error("@relationship type required");
    }
    if (typeArg.value.kind !== Kind.STRING) {
        throw new Error("@relationship type not a string");
    }

    return typeArg.value.value;
}

function getProperties(directiveArguments: Readonly<ArgumentNode[]>) {
    const propertiesArg = directiveArguments.find((x) => x.name.value === "properties");
    if (propertiesArg && propertiesArg.value.kind !== Kind.STRING) {
        throw new Error("@relationship properties not a string");
    }
    return (propertiesArg?.value as StringValueNode)?.value;
}

function getDirection(directiveArguments: Readonly<ArgumentNode[]>): RelationshipDirection {
    const directionArg = directiveArguments.find((x) => x.name.value === "direction");
    if (!directionArg) {
        throw new Error("@relationship direction required");
    }
    if (directionArg.value.kind !== Kind.ENUM) {
        throw new Error("@relationship direction not a enum");
    }
    if (!["IN", "OUT"].includes(directionArg.value.value)) {
        throw new Error("@relationship direction invalid");
    }

    return directionArg.value.value as RelationshipDirection;
}

function getQueryDirection(directiveArguments: Readonly<ArgumentNode[]>): RelationshipQueryDirectionOption {
    const queryDirectionArg = directiveArguments.find((x) => x.name.value === "queryDirection");
    let queryDirection = RelationshipQueryDirectionOption.DEFAULT_DIRECTED;

    if (queryDirectionArg) {
        if (queryDirectionArg.value.kind !== Kind.ENUM) {
            throw new Error("@relationship queryDirection not an enum");
        }

        const queryDirectionValue = RelationshipQueryDirectionOption[queryDirectionArg.value.value];
        if (!Object.values(RelationshipQueryDirectionOption).includes(queryDirectionValue)) {
            throw new Error("@relationship queryDirection invalid");
        }
        queryDirection = queryDirectionArg.value.value as RelationshipQueryDirectionOption;
    }
    return queryDirection;
}

function getNestedOperations(directiveArguments: Readonly<ArgumentNode[]>): RelationshipNestedOperationsOption[] {
    const nestedOperations: RelationshipNestedOperationsOption[] = [];

    const nestedOperationsArg = directiveArguments.find((x) => x.name.value === "nestedOperations");

    if (!nestedOperationsArg) {
        return defaultNestedOperations;
    }

    if (nestedOperationsArg.value.kind !== Kind.LIST) {
        throw new Error("@relationship nestedOperations not a list");
    }

    for (const [index, nestedOperationsArgValue] of nestedOperationsArg.value.values.entries()) {
        if (nestedOperationsArgValue.kind !== Kind.ENUM) {
            throw new Error(`@relationship nestedOperations value at index position ${index} not an enum`);
        }

        const nestedOperationsValue = RelationshipNestedOperationsOption[nestedOperationsArgValue.value];
        if (!Object.values(RelationshipNestedOperationsOption).includes(nestedOperationsValue)) {
            throw new Error(`@relationship nestedOperations value at index position ${index} invalid`);
        }
        nestedOperations.push(nestedOperationsValue);
    }
    return nestedOperations;
}

export default getRelationshipMeta;
