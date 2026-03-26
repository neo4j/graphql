/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DefinitionNode } from "graphql";

export type Enricher = (accumulatedDefinitions: DefinitionNode[], definition: DefinitionNode) => DefinitionNode[];
