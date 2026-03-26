/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function isUnionEntity(entity: EntityAdapter | RelationshipAdapter): entity is UnionEntityAdapter {
    return entity instanceof UnionEntityAdapter;
}
