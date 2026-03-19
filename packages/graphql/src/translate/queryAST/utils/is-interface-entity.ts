/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function isInterfaceEntity(entity: EntityAdapter | RelationshipAdapter): entity is InterfaceEntityAdapter {
    return entity instanceof InterfaceEntityAdapter;
}
