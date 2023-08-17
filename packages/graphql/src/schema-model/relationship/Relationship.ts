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
import { upperFirst } from "../../utils/upper-first";
import type { Attribute } from "../attribute/Attribute";
import type { ConcreteEntity } from "../entity/ConcreteEntity";
import type { Entity } from "../entity/Entity";

export type RelationshipDirection = "IN" | "OUT";
export type QueryDirection = "DEFAULT_DIRECTED" | "DEFAULT_UNDIRECTED" | "DIRECTED_ONLY" | "UNDIRECTED_ONLY";
export type NestedOperation = "CREATE" | "UPDATE" | "DELETE" | "CONNECT" | "DISCONNECT" | "CONNECT_OR_CREATE";

export class Relationship {
    public readonly name: string; // name of the relationship field, e.g. friends
    public readonly type: string; // name of the relationship type, e.g. "IS_FRIENDS_WITH"
    public readonly attributes: Map<string, Attribute> = new Map();
    public readonly source: ConcreteEntity;
    public readonly target: Entity;
    public readonly direction: RelationshipDirection;
    public readonly isList: boolean;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;

    // TODO: Remove  connectionFieldTypename and relationshipFieldTypename and delegate to the adapter
    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Relationship`;
    }

    constructor({
        name,
        type,
        attributes = [],
        source,
        target,
        direction,
        isList,
        queryDirection,
        nestedOperations,
        aggregate,
    }: {
        name: string;
        type: string;
        attributes?: Attribute[];
        source: ConcreteEntity;
        target: Entity;
        direction: RelationshipDirection;
        isList: boolean;
        queryDirection: QueryDirection;
        nestedOperations: NestedOperation[];
        aggregate: boolean;
    }) {
        this.type = type;
        this.source = source;
        this.target = target;
        this.name = name;
        this.direction = direction;
        this.isList = isList;
        this.queryDirection = queryDirection;
        this.nestedOperations = nestedOperations;
        this.aggregate = aggregate;

        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }
    }

    public clone(): Relationship {
        return new Relationship({
            name: this.name,
            type: this.type,
            attributes: Array.from(this.attributes.values()).map((a) => a.clone()),
            source: this.source,
            target: this.target,
            direction: this.direction,
            isList: this.isList,
            queryDirection: this.queryDirection,
            nestedOperations: this.nestedOperations,
            aggregate: this.aggregate,
        });
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
}
