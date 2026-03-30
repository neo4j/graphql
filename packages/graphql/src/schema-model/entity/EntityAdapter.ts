/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ConcreteEntityAdapter } from "./model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "./model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "./model-adapters/UnionEntityAdapter";

export type EntityAdapter = ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter;
