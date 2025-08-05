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

import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import type { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../../constants";
import type { Annotations } from "../annotation/Annotation";
import type { Argument } from "../argument/Argument";
import type { Attribute } from "../attribute/Attribute";
import type { Entity } from "../entity/Entity";

export type RelationshipDirection = "IN" | "OUT";
// "DIRECTED" | "UNDIRECTED";
export type QueryDirection = keyof typeof RelationshipQueryDirectionOption;
// "CREATE" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT"
export type NestedOperation = keyof typeof RelationshipNestedOperationsOption;

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

    private addAttribute(attribute: Attribute): void {
        if (this.attributes.has(attribute.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Attribute ${attribute.name} already exists in ${this.name}.`);
        }
        this.attributes.set(attribute.name, attribute);
    }

    public setSiblings(siblingPropertiesTypeNames: string[]) {
        this.siblings = siblingPropertiesTypeNames;
    }

    public getSiblings(): string[] | undefined {
        return this.siblings;
    }
}
