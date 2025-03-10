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
