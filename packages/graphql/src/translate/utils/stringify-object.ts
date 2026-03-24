/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";

/** Serializes object into a string for Cypher objects */
export function stringifyObject(fields: Record<string, Cypher.Raw | string | undefined | null>): Cypher.Raw {
    return new Cypher.Raw(
        (env) =>
            `{ ${Object.entries(fields)
                .filter(([, value]) => Boolean(value))
                .map(([key, value]): string | undefined => {
                    if (value instanceof Cypher.Raw) {
                        return `${key}: ${env.compile(value)}`;
                    } else {
                        return `${key}: ${value}`;
                    }
                })
                .join(", ")} }`
    );
}
