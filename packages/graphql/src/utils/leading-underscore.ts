/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

// leadingUnderscores function returns the leading underscores from the beginning of a given string name. If there are no leading underscores, it returns an empty string.
export function leadingUnderscores(name: string): string {
    const re = /^(_+).+/;
    const match = re.exec(name);
    return match?.[1] || "";
}
