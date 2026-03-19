/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export function escapeLabel(label: string): string {
    const escapedLabel = label.replace(/\\u0060/g, "`").replace(/`/g, "``");
    return `\`${escapedLabel}\``;
}
