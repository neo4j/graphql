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

import type {
    EnumTypeComposer,
    InputTypeComposer,
    ListComposer,
    NonNullComposer,
    ObjectTypeComposer,
    ScalarTypeComposer,
} from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import {
    GraphQLBuiltInScalarType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
} from "../../../schema-model/attribute/AttributeType";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { attributeAdapterToComposeFields } from "../../../schema/to-compose";
import { connectionOperationResolver } from "../../resolvers/connection-operation-resolver";
import type { RelatedEntityTypeNames } from "../../schema-model/graphql-type-names/RelatedEntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { SchemaTypes } from "./SchemaTypes";
import type { TopLevelEntitySchemaTypes } from "./TopLevelEntitySchemaTypes";
import { RelatedEntityFilterSchemaTypes } from "./filter-schema-types/RelatedEntityFilterSchemaTypes";

export class RelatedEntitySchemaTypes {
    public filterSchemaTypes: RelatedEntityFilterSchemaTypes;
    private relationship: Relationship;
    private schemaBuilder: SchemaBuilder;
    private entityTypeNames: RelatedEntityTypeNames;
    private schemaTypes: SchemaTypes;

    constructor({
        relationship,
        schemaBuilder,
        entityTypeNames,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        schemaTypes: SchemaTypes;
        entityTypeNames: RelatedEntityTypeNames;
    }) {
        this.relationship = relationship;
        this.filterSchemaTypes = new RelatedEntityFilterSchemaTypes({
            schemaBuilder,
            relationship: relationship,
            schemaTypes,
        });
        this.schemaBuilder = schemaBuilder;
        this.entityTypeNames = entityTypeNames;
        this.schemaTypes = schemaTypes;
    }

    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.connectionOperation, () => {
            const args: {
                first: ScalarTypeComposer;
                after: ScalarTypeComposer;
                sort?: ListComposer<NonNullComposer<InputTypeComposer>>;
            } = {
                first: this.schemaBuilder.types.int,
                after: this.schemaBuilder.types.string,
            };
            if (this.isSortable()) {
                args.sort = this.connectionSort.NonNull.List;
            }
            return {
                fields: {
                    connection: {
                        type: this.connection,
                        args: args,
                        resolve: connectionOperationResolver,
                    },
                },
            };
        });
    }

    private get connection(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.connection, () => {
            return {
                fields: {
                    pageInfo: this.schemaTypes.staticTypes.pageInfo,
                    edges: this.edge.List,
                },
            };
        });
    }

    private get connectionSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.connectionSort, () => {
            return {
                fields: {
                    edges: this.edgeSort,
                },
            };
        });
    }

    private get edge(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.edge, () => {
            const properties = this.getEdgeProperties();
            const fields = {
                node: this.nodeType,
                cursor: this.schemaBuilder.types.string,
            };

            if (properties) {
                fields["properties"] = properties;
            }
            return {
                fields,
            };
        });
    }

    private get edgeSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.edgeSort, () => {
            const edgeSortFields = {};
            const properties = this.getEdgeSortProperties();
            if (properties) {
                edgeSortFields["properties"] = properties;
            }
            if (this.getTargetEntitySchemaTypes().isSortable()) {
                edgeSortFields["node"] = this.nodeSort;
            }

            return { fields: edgeSortFields };
        });
    }

    public get nodeType(): ObjectTypeComposer {
        return this.getTargetEntitySchemaTypes().nodeType;
    }

    public get nodeSort(): InputTypeComposer {
        return this.getTargetEntitySchemaTypes().nodeSort;
    }

    @Memoize()
    private getTargetEntitySchemaTypes(): TopLevelEntitySchemaTypes {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        return this.schemaTypes.getEntitySchemaTypes(target);
    }

    public isSortable(): boolean {
        const isTargetSortable = this.getTargetEntitySchemaTypes().isSortable();
        return this.getRelationshipSortableFields().length > 0 || isTargetSortable;
    }

    @Memoize()
    private getRelationshipFields(): Attribute[] {
        return [...this.relationship.attributes.values()];
    }

    private getEdgeSortProperties(): InputTypeComposer | undefined {
        if (this.entityTypeNames.propertiesSort && this.getRelationshipSortableFields().length > 0) {
            return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.propertiesSort, () => {
                return {
                    fields: this.getRelationshipSortFields(),
                };
            });
        }
    }

    private getRelationshipFieldsDefinition(): Record<string, any> {
        const entityAttributes = this.getRelationshipFields().map((attribute) => new AttributeAdapter(attribute));
        return attributeAdapterToComposeFields(entityAttributes, new Map());
    }

    private getRelationshipSortFields(): Record<string, EnumTypeComposer> {
        return Object.fromEntries(
            this.getRelationshipSortableFields().map((attribute) => [
                attribute.name,
                this.schemaTypes.staticTypes.sortDirection,
            ])
        );
    }

    @Memoize()
    private getRelationshipSortableFields(): Attribute[] {
        return this.getRelationshipFields().filter(
            (field) =>
                field.type.name === GraphQLBuiltInScalarType[field.type.name] ||
                field.type.name === Neo4jGraphQLNumberType[field.type.name] ||
                field.type.name === Neo4jGraphQLTemporalType[field.type.name]
        );
    }

    private getEdgeProperties(): ObjectTypeComposer | undefined {
        if (this.entityTypeNames.properties) {
            return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.properties, () => {
                const fields = this.getRelationshipFieldsDefinition();
                return {
                    fields,
                };
            });
        }
    }
}
