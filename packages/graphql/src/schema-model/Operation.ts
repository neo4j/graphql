/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQLSchemaValidationError } from "../classes";

import type { Annotations } from "./annotation/Annotation";
import type { Attribute } from "./attribute/Attribute";

export class Operation {
    public readonly name: string;
    //  only includes custom Cypher fields
    public readonly attributes: Map<string, Attribute> = new Map();
    public readonly userResolvedAttributes: Map<string, Attribute> = new Map();
    public readonly annotations: Partial<Annotations>;

    constructor({
        name,
        attributes = [],
        userResolvedAttributes = [],
        annotations = {},
    }: {
        name: string;
        attributes?: Attribute[];
        userResolvedAttributes?: Attribute[];
        annotations?: Partial<Annotations>;
    }) {
        this.name = name;
        this.annotations = annotations;

        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }
        for (const attribute of userResolvedAttributes) {
            this.addUserResolvedAttributes(attribute);
        }
    }

    public findAttribute(name: string): Attribute | undefined {
        return this.attributes.get(name);
    }

    public findUserResolvedAttributes(name: string): Attribute | undefined {
        return this.userResolvedAttributes.get(name);
    }

    private addAttribute(attribute: Attribute): void {
        if (this.attributes.has(attribute.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Attribute ${attribute.name} already exists in ${this.name}`);
        }
        this.attributes.set(attribute.name, attribute);
    }

    private addUserResolvedAttributes(attribute: Attribute): void {
        if (this.userResolvedAttributes.has(attribute.name)) {
            throw new Neo4jGraphQLSchemaValidationError(
                `User Resolved Attribute ${attribute.name} already exists in ${this.name}`
            );
        }
        this.userResolvedAttributes.set(attribute.name, attribute);
    }
}
