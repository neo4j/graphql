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
import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import type { RelationField } from "../../types";
import type * as Cypher from "../cypher-builder/CypherBuilder";

/** Returns a CypherBuilder pattern taking field direction params into account */
export function getPattern({
    relationship,
    resolveTree,
    field,
}: {
    relationship: Cypher.Relationship;
    resolveTree: ResolveTree;
    field: RelationField;
}): Cypher.Pattern {
    const direction = getRelationshipDirection(field, resolveTree.args);

    const relPattern = relationship.pattern({
        directed: direction !== "undirected",
    });
    if (direction === "IN") relPattern.reverse();
    return relPattern;
}
