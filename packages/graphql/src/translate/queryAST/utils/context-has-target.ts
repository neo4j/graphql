/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../ast/QueryASTContext";

/** Checks if provided context has the target field defined (which would make it a nested translation context) */
export function hasTarget(context: QueryASTContext): context is QueryASTContext<Cypher.Node> & { target: Cypher.Node } {
    return context.target !== undefined;
}
