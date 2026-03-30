/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function isRelationshipEntity(entity: EntityAdapter | RelationshipAdapter): entity is RelationshipAdapter {
    return entity instanceof RelationshipAdapter;
}
