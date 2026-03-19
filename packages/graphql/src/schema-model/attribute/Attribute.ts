/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { type Annotations } from "../annotation/Annotation";
import type { Argument } from "../argument/Argument";
import type { AttributeType } from "./AttributeType";

export class Attribute {
    public readonly name: string;
    public readonly annotations: Partial<Annotations>;
    public readonly type: AttributeType;
    public readonly databaseName: string;
    public readonly description?: string;
    public readonly args: Argument[];

    constructor({
        name,
        annotations = {},
        type,
        args,
        databaseName,
        description,
    }: {
        name: string;
        annotations?: Partial<Annotations>;
        type: AttributeType;
        args: Argument[];
        databaseName?: string;
        description?: string;
    }) {
        this.name = name;
        this.annotations = annotations;
        this.type = type;
        this.args = args;
        this.databaseName = databaseName ?? name;
        this.description = description;
    }

    public clone(): Attribute {
        return new Attribute({
            name: this.name,
            annotations: this.annotations,
            type: this.type,
            args: this.args,
            databaseName: this.databaseName,
            description: this.description,
        });
    }
}
