/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */


import type { DirectiveNode } from "graphql";

export function findDirective(directives: readonly DirectiveNode[] = [], name: string): DirectiveNode | undefined {
    return directives.find((d) => {
        return d.name.value === name;
    });
}
