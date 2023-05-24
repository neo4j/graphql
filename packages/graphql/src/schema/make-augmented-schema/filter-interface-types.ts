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

import type { InterfaceTypeDefinitionNode } from "graphql";

function filterInterfaceTypes(
    interfaceTypes: InterfaceTypeDefinitionNode[],
    relationshipPropertyInterfaceNames: Set<string>,
    interfaceRelationshipNames: Set<string>
): {
    relationshipProperties: InterfaceTypeDefinitionNode[];
    interfaceRelationships: InterfaceTypeDefinitionNode[];
    filteredInterfaceTypes: InterfaceTypeDefinitionNode[];
} {
    const relationshipProperties: InterfaceTypeDefinitionNode[] = [];
    const interfaceRelationships: InterfaceTypeDefinitionNode[] = [];
    const filteredInterfaceTypes: InterfaceTypeDefinitionNode[] = [];
    for (const interfaceType of interfaceTypes) {
        let matched = false;

        if (relationshipPropertyInterfaceNames.has(interfaceType.name.value)) {
            relationshipProperties.push(interfaceType);
            matched = true;
        }

        if (interfaceRelationshipNames.has(interfaceType.name.value)) {
            interfaceRelationships.push(interfaceType);
            matched = true;
        }

        if (!matched) {
            filteredInterfaceTypes.push(interfaceType);
        }
    }

    return {
        relationshipProperties,
        interfaceRelationships,
        filteredInterfaceTypes,
    };
}

export default filterInterfaceTypes;
