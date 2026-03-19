/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import camelcase from "camelcase";

export default function pascalCase(str: string): string {
    if (!str.length) {
        return str;
    }
    return str[0].toUpperCase() + camelcase(str.slice(1));
}
