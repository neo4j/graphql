/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

/** Return the labels of an entity */
export function getEntityLabels(entity: EntityAdapter, neo4jGraphQLContext?: Neo4jGraphQLContext): string[] {
    const nodeLabels = entity instanceof ConcreteEntityAdapter ? entity.getLabels() : [entity.name];
    return neo4jGraphQLContext ? mapLabelsWithContext(nodeLabels, neo4jGraphQLContext) : nodeLabels;
}
