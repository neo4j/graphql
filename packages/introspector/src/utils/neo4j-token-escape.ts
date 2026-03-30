/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

export default function neo4jTokenEscape(token: string): string {
    return `\`${token.replace(/^`(.*?)`$/, "$1").replace("`", "``")}\``;
}
