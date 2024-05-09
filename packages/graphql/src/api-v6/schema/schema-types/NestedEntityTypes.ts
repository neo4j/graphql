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

import type { InputTypeComposer, ListComposer, NonNullComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import type { NestedEntityTypeNames } from "../../graphQLTypeNames/NestedEntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import { EntityTypes } from "./EntityTypes";
import type { StaticTypes } from "./StaticTypes";

export class NestedEntitySchemaTypes extends EntityTypes<NestedEntityTypeNames> {
    private relationship: Relationship;

    constructor({
        relationship,
        schemaBuilder,
        entityTypes,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        staticTypes: StaticTypes;
        entityTypes: NestedEntityTypeNames;
    }) {
        super({
            schemaBuilder,
            entityTypes,
            staticTypes,
        });
        this.relationship = relationship;
    }

    @Memoize()
    public get nodeType(): string {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        return target.types.nodeType;
    }

    protected getEdgeProperties(): ObjectTypeComposer | undefined {
        if (this.entityTypes.propertiesType) {
            const fields = this.getRelationshipFields();
            return this.schemaBuilder.getOrCreateObjectType(this.entityTypes.propertiesType, fields);
        }
    }

    protected getFields(): Attribute[] {
        return [...this.relationship.attributes.values()];
    }
    protected getConnectionArgs(): { sort?: ListComposer<NonNullComposer<InputTypeComposer>> | undefined } {
        return {};
    }
    private getRelationshipFields(): Record<string, string> {
        return Object.fromEntries(
            [...this.relationship.attributes.values()].map((attribute) => [attribute.name, attribute.type.name])
        );
    }
}
