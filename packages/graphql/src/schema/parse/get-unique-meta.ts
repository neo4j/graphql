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

import type {
    BooleanValueNode,
    DirectiveNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    StringValueNode,
} from "graphql";
import { Kind } from "graphql";
import type { Unique } from "../../types";

function getUniqueMeta(
    directives: DirectiveNode[],
    type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    fieldName: string,
): Unique | undefined {
    const uniqueDirective = directives.find((x) => x.name.value === "unique");

    if (uniqueDirective && type.kind === Kind.INTERFACE_TYPE_DEFINITION) {
        throw new Error(`@unique directive cannot be used on interface type fields: ${type.name.value}.${fieldName}`);
    }

    if (uniqueDirective) {
        const constraintName = uniqueDirective.arguments?.find((a) => a.name.value === "constraintName");
        return {
            constraintName: constraintName
                ? (constraintName.value as StringValueNode).value
                : `${type.name.value}_${fieldName}`,
        };
    }

    let uniqueId = false;

    const idDirective = directives.find((x) => x.name.value === "id");

    if (idDirective) {
        const idDirectiveUniqueArgument = idDirective?.arguments?.find((a) => a.name.value === "unique")?.value as
            | BooleanValueNode
            | undefined;
        // If unique argument is absent from @id directive, default is to use unique constraint
        uniqueId = idDirectiveUniqueArgument ? idDirectiveUniqueArgument.value : true;
    }

    if (uniqueId) {
        return {
            constraintName: `${type.name.value}_${fieldName}`,
        };
    }
}

export default getUniqueMeta;
