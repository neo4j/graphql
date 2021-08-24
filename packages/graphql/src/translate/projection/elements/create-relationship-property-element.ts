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

import { ResolveTree } from "graphql-parse-resolve-info";
import Relationship from "../../../classes/Relationship";
import createDatetimeElement from "./create-datetime-element";
import createPointElement from "./create-point-element";

function createRelationshipPropertyElement({
    resolveTree,
    relationship,
    relationshipVariable,
}: {
    resolveTree: ResolveTree;
    relationship: Relationship;
    relationshipVariable: string;
}): string {
    const datetimeField = relationship.dateTimeFields.find((f) => f.fieldName === resolveTree.name);
    const pointField = relationship.pointFields.find((f) => f.fieldName === resolveTree.name);

    if (datetimeField) {
        return createDatetimeElement({ resolveTree, field: datetimeField, variable: relationshipVariable });
    }

    if (pointField) {
        return createPointElement({ resolveTree, field: pointField, variable: relationshipVariable });
    }

    let dbFieldName = resolveTree.name;
    const relPropField = relationship.primitiveFields.find(({ fieldName }) => fieldName === resolveTree.name);
    if (relPropField && relPropField.alias) {
        dbFieldName = relPropField.alias;
    }
    return `${resolveTree.alias}: ${relationshipVariable}.${dbFieldName}`;
}

export default createRelationshipPropertyElement;
