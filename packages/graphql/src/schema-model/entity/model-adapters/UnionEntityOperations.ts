/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UnionEntityAdapter } from "./UnionEntityAdapter";
type RootTypeFieldNames = {
    read: string;
};

export class UnionEntityOperations {
    private readonly unionEntityAdapter: UnionEntityAdapter;

    constructor(unionEntityAdapter: UnionEntityAdapter) {
        this.unionEntityAdapter = unionEntityAdapter;
    }

    public get whereInputTypeName(): string {
        return `${this.unionEntityAdapter.name}Where`;
    }

    public get subscriptionEventPayloadTypeName(): string {
        return `${this.unionEntityAdapter.name}EventPayload`;
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            read: this.unionEntityAdapter.plural,
        };
    }
}
