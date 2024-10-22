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

import type { DirectiveNode, FieldDefinitionNode } from "graphql";
import type { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../constants";
import { relationshipDirective } from "../graphql/directives/relationship";
import { parseArguments } from "../schema-model/parser/parse-arguments";
import Cypher from "@neo4j/cypher-builder";
import type { RelationshipDirection } from "../schema-model/relationship/Relationship";

type RelationshipMeta = {
    direction: RelationshipDirection;
    type: string;
    typeUnescaped: string;
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

    const relationshipMetaObject = getRelationshipDirectiveArguments(directive);
    const typeUnescaped = relationshipMetaObject.type as string;
    const type = Cypher.utils.escapeLabel(typeUnescaped);

    return {
        ...relationshipMetaObject,
        type,
        typeUnescaped,
    } as RelationshipMeta;
}

function getRelationshipDirectiveArguments(directiveNode: DirectiveNode) {
    return parseArguments(relationshipDirective, directiveNode);
}

export default getRelationshipMeta;
