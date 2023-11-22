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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type Relationship from "../../../classes/Relationship";
import mapToDbProperty from "../../../utils/map-to-db-property";
import { createDatetimeExpression } from "./create-datetime-element";
import { createPointExpression } from "./create-point-element";
import type Cypher from "@neo4j/cypher-builder";

export function createRelationshipPropertyValue({
    resolveTree,
    relationship,
    relationshipVariable,
}: {
    resolveTree: ResolveTree;
    relationship: Relationship;
    relationshipVariable: Cypher.Relationship;
}): Cypher.Variable | Cypher.Expr {
    const temporalField = relationship.temporalFields.find((f) => f.fieldName === resolveTree.name);
    const pointField = relationship.pointFields.find((f) => f.fieldName === resolveTree.name);

    if (temporalField?.typeMeta.name === "DateTime") {
        return createDatetimeExpression({ resolveTree, field: temporalField, variable: relationshipVariable });
    }

    if (pointField) {
        return createPointExpression({ resolveTree, field: pointField, variable: relationshipVariable });
    }

    const dbFieldName = mapToDbProperty(relationship, resolveTree.name);
    return relationshipVariable.property(dbFieldName);
}
