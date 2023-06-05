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

import type { ArgumentNode, DirectiveNode, FieldDefinitionNode, StringValueNode } from "graphql";
import { Kind } from "graphql";
import { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../constants";
import { defaultNestedOperations, relationshipDirective } from "../graphql/directives/relationship";
import { getArgumentValues } from "../utils/get-argument-values";

type RelationshipDirection = "IN" | "OUT";

type RelationshipMeta = {
    direction: RelationshipDirection;
    type: string;
    properties?: string;
    queryDirection: RelationshipQueryDirectionOption;
    nestedOperations: RelationshipNestedOperationsOption[];
    aggregate: boolean;
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
    return getRelationshipDirectiveArguments(directive);
}

function getRelationshipDirectiveArguments(directiveNode: DirectiveNode): RelationshipMeta {
    return  getArgumentValues(relationshipDirective, directiveNode) as RelationshipMeta;
}

export default getRelationshipMeta;
