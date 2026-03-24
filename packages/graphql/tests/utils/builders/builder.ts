/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

/** Base class for test builders */

export abstract class Builder<T, C> {
    protected options: C;

    constructor(options: C) {
        this.options = options;
    }

    public abstract with(newOptions: Partial<C>): Builder<T, C>;

    public abstract instance(): T;
}
