/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { NestedEntityTypeNames } from "../../api-v6/graphQLTypeNames/NestedEntityTypeNames";
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import type { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../../constants";
import { upperFirst } from "../../utils/upper-first";
import type { Annotations } from "../annotation/Annotation";
import type { Argument } from "../argument/Argument";
import type { Attribute } from "../attribute/Attribute";
import { ConcreteEntity } from "../entity/ConcreteEntity";
import type { Entity } from "../entity/Entity";

export type RelationshipDirection = "IN" | "OUT";
export type QueryDirection = keyof typeof RelationshipQueryDirectionOption;
// "DEFAULT_DIRECTED" | "DEFAULT_UNDIRECTED" | "DIRECTED_ONLY" | "UNDIRECTED_ONLY";
export type NestedOperation = keyof typeof RelationshipNestedOperationsOption;
// "CREATE" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT" | "CONNECT_OR_CREATE";

export class Relationship {
    public readonly name: string; // name of the relationship field, e.g. friends
    public readonly type: string; // name of the relationship type, e.g. "IS_FRIENDS_WITH"
    public readonly args: Argument[];
    public readonly attributes: Map<string, Attribute> = new Map();
    public readonly source: Entity;
    public readonly target: Entity;
    public readonly direction: RelationshipDirection;
    public readonly isList: boolean;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description?: string;
    public readonly annotations: Partial<Annotations>;
    public readonly propertiesTypeName: string | undefined;
    public readonly firstDeclaredInTypeName: string | undefined; // the name of the Interface that declares this if this is an implementation (used in type names as prefix)
    public readonly originalTarget?: Entity; // the original target entity of the RelationshipDeclaration if this is an implementation (useful for type narrowing scenarios)
    private siblings?: string[]; // other Relationship that are implementations of the same RelationshipDeclaration as this

    constructor({
        name,
        type,
        args,
        attributes = [],
        source,
        target,
        direction,
        isList,
        queryDirection,
        nestedOperations,
        aggregate,
        isNullable,
        description,
        annotations = {},
        propertiesTypeName,
        firstDeclaredInTypeName,
        originalTarget,
        siblings,
    }: {
        name: string;
        type: string;
        args: Argument[];
        attributes?: Attribute[];
        source: Entity;
        target: Entity;
        direction: RelationshipDirection;
        isList: boolean;
        queryDirection: QueryDirection;
        nestedOperations: NestedOperation[];
        aggregate: boolean;
        isNullable: boolean;
        description?: string;
        annotations?: Partial<Annotations>;
        propertiesTypeName?: string;
        firstDeclaredInTypeName?: string;
        originalTarget?: Entity;
        siblings?: string[];
    }) {
        this.type = type;
        this.source = source;
        this.target = target;
        this.name = name;
        this.args = args;
        this.direction = direction;
        this.isList = isList;
        this.queryDirection = queryDirection;
        this.nestedOperations = nestedOperations;
        this.aggregate = aggregate;
        this.isNullable = isNullable;
        this.description = description;
        this.annotations = annotations;
        this.propertiesTypeName = propertiesTypeName;
        this.firstDeclaredInTypeName = firstDeclaredInTypeName;
        this.originalTarget = originalTarget;

        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }

        if (siblings) {
            this.setSiblings(siblings);
        }
    }

    public clone(): Relationship {
        return new Relationship({
            name: this.name,
            type: this.type,
            args: this.args,
            attributes: Array.from(this.attributes.values()).map((a) => a.clone()),
            source: this.source,
            target: this.target,
            direction: this.direction,
            isList: this.isList,
            queryDirection: this.queryDirection,
            nestedOperations: this.nestedOperations,
            aggregate: this.aggregate,
            isNullable: this.isNullable,
            description: this.description,
            annotations: this.annotations,
            propertiesTypeName: this.propertiesTypeName,
            firstDeclaredInTypeName: this.firstDeclaredInTypeName,
            originalTarget: this.originalTarget,
            siblings: this.siblings,
        });
    }

    /** Note: Types of the new API */
    public get types(): NestedEntityTypeNames {
        if (!(this.source instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported");
        }
        return this.source.types.relationship(this);
    }

    private addAttribute(attribute: Attribute): void {
        if (this.attributes.has(attribute.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Attribute ${attribute.name} already exists in ${this.name}.`);
        }
        this.attributes.set(attribute.name, attribute);
    }

    public findAttribute(name: string): Attribute | undefined {
        return this.attributes.get(name);
    }

    public hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }

    public setSiblings(siblingPropertiesTypeNames: string[]) {
        this.siblings = siblingPropertiesTypeNames;
    }

    public getSiblings(): string[] | undefined {
        return this.siblings;
    }

    // TODO: Remove  connectionFieldTypename and relationshipFieldTypename and delegate to the adapter
    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Relationship`;
    }
}
