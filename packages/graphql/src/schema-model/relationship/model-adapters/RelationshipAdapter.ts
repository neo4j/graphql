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

import { upperFirst } from "graphql-compose";
import type { Entity } from "../../entity/Entity";
import { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import type { NestedOperation, QueryDirection, Relationship, RelationshipDirection } from "../Relationship";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import type { Attribute } from "../../attribute/Attribute";
import { ConcreteEntity } from "../../entity/ConcreteEntity";
import { CompositeEntity } from "../../entity/CompositeEntity";

export class RelationshipAdapter {
    public readonly name: string;
    public readonly type: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly source: ConcreteEntityAdapter;
    private rawEntity: Entity;
    private _target: Entity | undefined;
    public readonly direction: RelationshipDirection;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;
    public readonly isList: boolean;

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Relationship`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public getAggregationFieldTypename(nestedField?: "node" | "edge"): string {
        const nestedFieldStr = upperFirst(nestedField || "");
        const aggregationStr = nestedField ? "Aggregate" : "Aggregation";
        return `${this.source.name}${upperFirst(this.target.name)}${upperFirst(
            this.name
        )}${nestedFieldStr}${aggregationStr}Selection`;
    }

    constructor(relationship: Relationship, sourceAdapter?: ConcreteEntityAdapter) {
        const {
            name,
            type,
            attributes = new Map<string, Attribute>(),
            source,
            target,
            direction,
            isList,
            queryDirection,
            nestedOperations,
            aggregate,
        } = relationship;
        this.name = name;
        this.type = type;
        if (sourceAdapter) {
            this.source = sourceAdapter;
        } else {
            this.source = new ConcreteEntityAdapter(source);
        }
        this.direction = direction;
        this.isList = isList;
        this.queryDirection = queryDirection;
        this.nestedOperations = nestedOperations;
        this.aggregate = aggregate;
        this.rawEntity = target;
        this.initAttributes(attributes);
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
        }
    }

    public findAttribute(name: string): AttributeAdapter | undefined {
        return this.attributes.get(name);
    }
    /**
     * translation-only
     *
     * @param directed the direction asked during the query, for instance "friends(directed: true)"
     * @returns the direction to use in the CypherBuilder
     **/
    public getCypherDirection(directed?: boolean): "left" | "right" | "undirected" {
        switch (this.queryDirection) {
            case "DIRECTED_ONLY": {
                return this.cypherDirectionFromRelDirection();
            }
            case "UNDIRECTED_ONLY": {
                return "undirected";
            }
            case "DEFAULT_DIRECTED": {
                if (directed === false) {
                    return "undirected";
                }
                return this.cypherDirectionFromRelDirection();
            }
            case "DEFAULT_UNDIRECTED": {
                if (directed === true) {
                    return this.cypherDirectionFromRelDirection();
                }
                return "undirected";
            }
        }
    }

    private cypherDirectionFromRelDirection(): "left" | "right" {
        return this.direction === "IN" ? "left" : "right";
    }

    // construct the target entity only when requested
    get target(): Entity {
        if (!this._target) {
            if (this.rawEntity instanceof ConcreteEntity) {
                this._target = new ConcreteEntityAdapter(this.rawEntity);
            } else if (this.rawEntity instanceof CompositeEntity) {
                this._target = new CompositeEntity(this.rawEntity);
            } else {
                throw new Error("invalid target entity type");
            }
        }
        return this._target;
    }
}
