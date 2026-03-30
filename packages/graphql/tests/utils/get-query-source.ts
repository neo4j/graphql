/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DocumentNode, Source } from "graphql";

/** Returns a valid source for graphql from a gql query */
export function getQuerySource(query: DocumentNode): Source {
    return query.loc!.source;
}
