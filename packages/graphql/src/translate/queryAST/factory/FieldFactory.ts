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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Field } from "../ast/fields/Field";
import { parseSelectionSetField } from "./parsers/parse-selection-set-fields";
import type { QueryASTFactory } from "./QueryASTFactory";
import { ConnectionField } from "../ast/fields/ConnectionField";
import { Relationship } from "../../../schema-model/relationship/Relationship";
import { AttributeType } from "../../../schema-model/attribute/Attribute";
import { PointAttributeField } from "../ast/fields/attribute-fields/PointAttributeField";
import { AttributeField } from "../ast/fields/attribute-fields/AttributeField";
import { DateTimeField } from "../ast/fields/attribute-fields/DateTimeField";
import { RelationshipField } from "../ast/fields/RelationshipField";

export class FieldFactory {
    private queryASTFactory: QueryASTFactory;
    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createFields(entity: ConcreteEntity | Relationship, rawFields: Record<string, ResolveTree>): Field[] {
        return Object.values(rawFields).map((field: ResolveTree) => {
            const { fieldName, isConnection } = parseSelectionSetField(field.name);
            if (isConnection) {
                if (entity instanceof Relationship) throw new Error("Cannot create connection field of relationship");
                return this.createConnectionField(entity, fieldName, field);
            }

            if (entity instanceof ConcreteEntity) {
                const relationship = entity.findRelationship(fieldName);
                if (relationship) {
                    return this.createRelationshipField(entity, relationship, fieldName, field);
                }
            }

            return this.createAttributeField({
                entity,
                fieldName,
                field,
            });
        });
    }

    private createAttributeField({
        entity,
        fieldName,
        field,
    }: {
        entity: ConcreteEntity | Relationship;
        fieldName: string;
        field: ResolveTree;
    }): AttributeField {
        const attribute = entity.findAttribute(fieldName);
        if (!attribute) throw new Error(`attribute ${fieldName} not found`);

        switch (attribute.type) {
            case AttributeType.Point: {
                const { crs } = field.fieldsByTypeName[attribute.type] as any;
                return new PointAttributeField({
                    attribute,
                    alias: field.alias,
                    crs: Boolean(crs),
                });
            }

            case AttributeType.DateTime: {
                return new DateTimeField({
                    attribute,
                    alias: field.alias,
                });
            }
            default: {
                return new AttributeField({ alias: field.alias, attribute });
            }
        }
    }

    private createConnectionField(entity: ConcreteEntity, fieldName: string, field: ResolveTree): ConnectionField {
        const relationship = entity.findRelationship(fieldName);
        if (!relationship) throw new Error(`Relationship  ${fieldName} not found in entity ${entity.name}`);
        const connectionOp = this.queryASTFactory.operationsFactory.createConnectionOperationAST(relationship, field);

        return new ConnectionField({
            operation: connectionOp,
            alias: field.alias,
        });
    }

    private createRelationshipField(
        entity: ConcreteEntity,
        relationship: Relationship,
        fieldName: string,
        field: ResolveTree
    ): RelationshipField {
        // const nestedFields = field.fieldsByTypeName[entity.name];
        // if (!relationship) throw new Error(`Relationship  ${fieldName} not found in entity ${entity.name}`);
        // const connectionOp = this.queryASTFactory.operationsFactory.createConnectionOperationAST(relationship, field);

        const operation = this.queryASTFactory.operationsFactory.createReadOperationAST(relationship, field);

        return new RelationshipField({
            operation,
            alias: field.alias,
        });
    }
}
