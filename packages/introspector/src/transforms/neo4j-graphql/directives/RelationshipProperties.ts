/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Directive } from "../types";

export class RelationshipPropertiesDirective implements Directive {
    toString(): string {
        return `@relationshipProperties`;
    }
}
