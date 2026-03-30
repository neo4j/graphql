/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Annotations } from "./annotation/Annotation";
import type { Attribute } from "./attribute/Attribute";
import { AttributeAdapter } from "./attribute/model-adapters/AttributeAdapter";
import type { Operation } from "./Operation";

export class OperationAdapter {
    public readonly name: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly userResolvedAttributes: Map<string, AttributeAdapter> = new Map();
    public readonly annotations: Partial<Annotations>;

    constructor(entity: Operation) {
        this.name = entity.name;
        this.initAttributes(entity.attributes);
        this.initUserResolvedAttributes(entity.userResolvedAttributes);
        this.annotations = entity.annotations;
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
        }
    }
    private initUserResolvedAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.userResolvedAttributes.set(attributeName, attributeAdapter);
        }
    }

    public get objectFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isObjectField());
    }
}
