/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { filterTruthy } from "../../../../utils/utils";

export function getDirectiveNames(field: FieldDefinitionNode | ObjectTypeDefinitionNode): string[] {
    const fieldDirectives = field.directives ?? [];
    return filterTruthy(fieldDirectives.map((d) => d.name.value));
}
