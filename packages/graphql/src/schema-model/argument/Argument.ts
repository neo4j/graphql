/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ValueNode } from "graphql";
import type { AttributeType } from "../attribute/AttributeType";
import { parseValueNode } from "../parser/parse-value-node";

export class Argument {
    public readonly name: string;
    public readonly type: AttributeType;
    public readonly defaultValue?: string;
    public readonly description?: string;
    // Arguments can have annotations but we don't seem to use this feature
    // public readonly annotations: Partial<Annotations> = {};

    constructor({
        name,
        type,
        defaultValue,
        description,
    }: {
        name: string;
        type: AttributeType;
        defaultValue?: ValueNode;
        description?: string;
    }) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue ? parseValueNode(defaultValue) : undefined;
        this.description = description;
    }
}
