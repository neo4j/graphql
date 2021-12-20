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

import { FieldDefinitionNode, StringValueNode } from "graphql";
import { RelationshipMeta } from "../types";

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

    const directionArg = directive.arguments?.find((x) => x.name.value === "direction");
    if (!directionArg) {
        throw new Error("@relationship direction required");
    }
    if (directionArg.value.kind !== "EnumValue") {
        throw new Error("@relationship direction not a enum");
    }
    if (!["IN", "OUT"].includes(directionArg.value.value)) {
        throw new Error("@relationship direction invalid");
    }

    const typeArg = directive.arguments?.find((x) => x.name.value === "type");
    if (!typeArg) {
        throw new Error("@relationship type required");
    }
    if (typeArg.value.kind !== "StringValue") {
        throw new Error("@relationship type not a string");
    }

    const propertiesArg = directive.arguments?.find((x) => x.name.value === "properties");
    if (propertiesArg && propertiesArg.value.kind !== "StringValue") {
        throw new Error("@relationship properties not a string");
    }

    const direction = directionArg.value.value as RelationshipMeta["direction"];
    const properties = (propertiesArg?.value as StringValueNode)?.value;
    const type = typeArg.value.value;

    const paramName = type.replace("|", "_").toLowerCase();
    const types = Array.from(new Set(type.split("|")));
    const multiple = types.length > 1;

    return {
        direction,
        multiple,
        properties,
        paramName,
        type,
        types,
    };
}

export default getRelationshipMeta;
