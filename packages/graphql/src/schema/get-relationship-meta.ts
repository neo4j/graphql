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

import Cypher from "@neo4j/cypher-builder";
import type { DirectiveNode, FieldDefinitionNode, StringValueNode } from "graphql";
import { RelationshipQueryDirectionOption } from "../constants";

type RelationshipMeta = {
    direction: "IN" | "OUT";
    type: string;
    typeUnescaped: string;
    properties?: string;
    queryDirection: RelationshipQueryDirectionOption;
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

    const queryDirection = getQueryDirection(directive);

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

    const direction = directionArg.value.value as "IN" | "OUT";
    const type = Cypher.utils.escapeLabel(typeArg.value.value);
    const typeUnescaped = typeArg.value.value;
    const properties = (propertiesArg?.value as StringValueNode)?.value;

    return {
        direction,
        type,
        typeUnescaped,
        properties,
        queryDirection,
    };
}

function getQueryDirection(directive: DirectiveNode): RelationshipQueryDirectionOption {
    const queryDirectionArg = directive.arguments?.find((x) => x.name.value === "queryDirection");
    let queryDirection = RelationshipQueryDirectionOption.DEFAULT_DIRECTED;

    if (queryDirectionArg) {
        if (queryDirectionArg.value.kind !== "EnumValue") {
            throw new Error("@relationship queryDirection is not a enum");
        }

        const queryDirectionValue = RelationshipQueryDirectionOption[
            queryDirectionArg.value.value
        ] as RelationshipQueryDirectionOption;
        if (!Object.values(RelationshipQueryDirectionOption).includes(queryDirectionValue)) {
            throw new Error("@relationship queryDirection invalid");
        }
        queryDirection = queryDirectionArg.value.value as RelationshipQueryDirectionOption;
    }
    return queryDirection;
}

export default getRelationshipMeta;
