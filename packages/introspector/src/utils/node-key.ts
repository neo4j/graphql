/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import neo4jTokenEscape from "./neo4j-token-escape";

export default function nodeKey(labels: string[]): string {
    const escapedLabels = labels.sort().map(neo4jTokenEscape);
    return `:${escapedLabels.join(":")}`;
}
