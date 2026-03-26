/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

export function buildClause(
    clause: Cypher.Clause,
    { context, prefix }: { context: Neo4jGraphQLTranslationContext; prefix?: string }
): Cypher.CypherResult {
    return clause.build({
        prefix,
        unsafeEscapeOptions: {
            disableNodeLabelEscaping: Boolean(context.features.unsafeEscapeOptions?.disableNodeLabelEscaping),
            disableRelationshipTypeEscaping: Boolean(
                context.features.unsafeEscapeOptions?.disableRelationshipTypeEscaping
            ),
        },
    });
}
