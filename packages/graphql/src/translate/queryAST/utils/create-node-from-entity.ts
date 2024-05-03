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
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { mapLabelsWithContext } from "../../../schema-model/utils/map-labels-with-context";
import type { Neo4jGraphQLContext } from "../../../types/neo4j-graphql-context";

export function createNode(name?: string): Cypher.Node {
    if (name) {
        return new Cypher.NamedNode(name);
    }
    return new Cypher.Node();
}

export function getEntityLabels(entity: EntityAdapter, neo4jGraphQLContext?: Neo4jGraphQLContext): string[] {
    const nodeLabels = entity instanceof ConcreteEntityAdapter ? entity.getLabels() : [entity.name];
    return neo4jGraphQLContext ? mapLabelsWithContext(nodeLabels, neo4jGraphQLContext) : nodeLabels;
}

export function createRelationship(name?: string): Cypher.Relationship {
    if (name) {
        return new Cypher.NamedRelationship(name);
    }
    return new Cypher.Relationship();
}
