/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { AttributeAdapter } from "./AttributeAdapter";

export class ListAdapter {
    readonly AttributeAdapter: AttributeAdapter;

    constructor(AttributeAdapter: AttributeAdapter) {
        if (!AttributeAdapter.typeHelper.isList()) {
            throw new Error("Attribute is not a list");
        }
        this.AttributeAdapter = AttributeAdapter;
    }

    getPush(): string {
        return `${this.AttributeAdapter.name}_PUSH`;
    }

    getPop(): string {
        return `${this.AttributeAdapter.name}_POP`;
    }

    getIncludes(): string {
        return `${this.AttributeAdapter.name}_INCLUDES`;
    }
}
