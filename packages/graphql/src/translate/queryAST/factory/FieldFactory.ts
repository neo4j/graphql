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

import { mergeDeep } from "@graphql-tools/utils";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { CypherAnnotation } from "../../../schema-model/annotation/CypherAnnotation";
import type { ListType } from "../../../schema-model/attribute/AttributeType";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { getEntityAdapter } from "../../../schema-model/utils/get-entity-adapter";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../utils/utils";
import { checkEntityAuthentication } from "../../authorization/check-authentication";
import type { Field } from "../ast/fields/Field";
import { OperationField } from "../ast/fields/OperationField";
import { AggregationAttributeField } from "../ast/fields/aggregation-fields/AggregationAttributeField";
import type { AggregationField } from "../ast/fields/aggregation-fields/AggregationField";
import { CountField } from "../ast/fields/aggregation-fields/CountField";
import { AttributeField } from "../ast/fields/attribute-fields/AttributeField";
import { DateTimeField } from "../ast/fields/attribute-fields/DateTimeField";
import { PointAttributeField } from "../ast/fields/attribute-fields/PointAttributeField";
import type { ConnectionReadOperation } from "../ast/operations/ConnectionReadOperation";
import type { CompositeConnectionReadOperation } from "../ast/operations/composite/CompositeConnectionReadOperation";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import type { QueryASTFactory } from "./QueryASTFactory";
import { parseSelectionSetField } from "./parsers/parse-selection-set-fields";

export class FieldFactory {
    private queryASTFactory: QueryASTFactory;
    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createFields(
        entity: ConcreteEntityAdapter | RelationshipAdapter,
        rawFields: Record<string, ResolveTree>,
        context: Neo4jGraphQLTranslationContext
    ): Field[] {
        const fieldsToMerge = filterTruthy(
            Object.values(rawFields).map((field) => {
                const { fieldName } = parseSelectionSetField(field.name);

                return this.getRequiredResolveTree({
                    entity,
                    fieldName,
                });
            })
        );

        const mergedFields: Record<string, ResolveTree> = mergeDeep([rawFields, ...fieldsToMerge]);

        const fields = Object.values(mergedFields).flatMap((field: ResolveTree): Field[] | Field | undefined => {
            const { fieldName, isConnection, isAggregation } = parseSelectionSetField(field.name);
            if (isConcreteEntity(entity)) {
                // TODO: Move this to the tree
                checkEntityAuthentication({
                    entity: entity.entity,
                    targetOperations: ["READ"],
                    context,
                    field: field.name,
                });
                const relationship = entity.findRelationship(fieldName);
                if (relationship) {
                    if (isConnection) {
                        return this.createConnectionField(relationship, field, context);
                    }

                    if (isAggregation) {
                        return this.createRelationshipAggregationField(relationship, field, context);
                    }
                    return this.createRelationshipField({ relationship, field, context });
                }
                if (!relationship && (isConnection || isAggregation)) {
                    throw new Error(`Relationship ${fieldName} not found in entity ${entity.name}`);
                }
            }

            return this.createAttributeField({
                entity,
                fieldName,
                field,
                context,
            });
        });

        return filterTruthy(fields);
    }

    private createRelationshipAggregationField(
        relationship: RelationshipAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): OperationField {
        const operation = this.queryASTFactory.operationsFactory.createAggregationOperation(
            relationship,
            resolveTree,
            context
        );
        return new OperationField({
            alias: resolveTree.alias,
            operation,
        });
    }

    public createAggregationFields(
        entity: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter,
        rawFields: Record<string, ResolveTree>
    ): AggregationField[] {
        return filterTruthy(
            Object.values(rawFields).map((field) => {
                if (field.name === "count") {
                    return new CountField({
                        alias: field.alias,
                        entity: entity as any,
                    });
                } else {
                    const attribute = entity.findAttribute(field.name);
                    if (!attribute) {
                        throw new Error(`Attribute ${field.name} not found`);
                    }

                    const aggregateFields = field.fieldsByTypeName[attribute.getAggregateSelectionTypeName()] || {};

                    const aggregationProjection = Object.values(aggregateFields).reduce((acc, f) => {
                        acc[f.name] = f.alias;
                        return acc;
                    }, {});

                    return new AggregationAttributeField({
                        attribute,
                        alias: field.alias,
                        aggregationProjection,
                    });
                }
            })
        );
    }

    private getRequiredResolveTree({
        entity,
        fieldName,
    }: {
        entity: ConcreteEntityAdapter | RelationshipAdapter;
        fieldName: string;
    }): Record<string, ResolveTree> | undefined {
        const attribute = entity.findAttribute(fieldName);
        if (!attribute) {
            return;
        }

        const customResolver = attribute.annotations.customResolver;
        if (!customResolver) {
            return;
        }

        return customResolver.parsedRequires;
    }

    private createAttributeField({
        entity,
        fieldName,
        field,
        context,
    }: {
        entity: ConcreteEntityAdapter | RelationshipAdapter;
        fieldName: string;
        field: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): AttributeField | OperationField | undefined {
        if (["cursor", "node"].includes(fieldName)) {
            return;
        }
        const attribute = entity.findAttribute(fieldName);

        if (fieldName === "id" && !attribute && isConcreteEntity(entity)) {
            const globalIdAttribute = entity.globalIdField;
            if (!globalIdAttribute) {
                throw new Error(`attribute ${fieldName} not found`);
            }
            return new AttributeField({ alias: globalIdAttribute.name, attribute: globalIdAttribute });
        }

        if (!attribute) {
            throw new Error(`attribute ${fieldName} not found`);
        }

        const cypherAnnotation = attribute.annotations.cypher;
        if (cypherAnnotation) {
            return this.createCypherAttributeField({
                field,
                attribute,
                context,
                cypherAnnotation,
            });
        }

        if (attribute.typeHelper.isPoint() || attribute.typeHelper.isCartesianPoint()) {
            const typeName = attribute.typeHelper.isList()
                ? (attribute.type as ListType).ofType.name
                : attribute.type.name;
            const { crs } = field.fieldsByTypeName[typeName] as any;
            return new PointAttributeField({
                attribute,
                alias: field.alias,
                crs: Boolean(crs),
            });
        }

        if (attribute.typeHelper.isDateTime()) {
            return new DateTimeField({
                attribute,
                alias: field.alias,
            });
        }

        return new AttributeField({ alias: field.alias, attribute });
    }

    private createCypherAttributeField({
        field,
        attribute,
        context,
        cypherAnnotation,
    }: {
        attribute: AttributeAdapter;
        field: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        cypherAnnotation: CypherAnnotation;
    }): OperationField {
        const typeName = attribute.typeHelper.isList() ? (attribute.type as ListType).ofType.name : attribute.type.name;
        const rawFields = field.fieldsByTypeName[typeName];
        const extraParams: Record<string, any> = {};

        if (cypherAnnotation.statement.includes("$jwt") && context.authorization.jwtParam) {
            extraParams.jwt = context.authorization.jwtParam.value;
        }
        // move the used specified arguments in a different object
        const cypherArguments = { ...field.args };
        field.args = {};

        if (rawFields) {
            if (attribute.typeHelper.isObject()) {
                const concreteEntity = this.queryASTFactory.schemaModel.getConcreteEntityAdapter(typeName);
                if (!concreteEntity) {
                    throw new Error(`Entity ${typeName} not found`);
                }

                return this.createCypherOperationField({
                    target: concreteEntity,
                    field,
                    context,
                    cypherAttributeField: attribute,
                    cypherArguments,
                });
            } else if (attribute.typeHelper.isAbstract()) {
                const entity = this.queryASTFactory.schemaModel.getEntity(typeName);
                // Raise an error as we expect that any complex attributes type are always entities
                if (!entity) {
                    throw new Error(`Entity ${typeName} not found`);
                }
                if (!entity.isCompositeEntity()) {
                    throw new Error(`Entity ${typeName} is not a composite entity`);
                }
                const targetEntity = getEntityAdapter(entity);
                return this.createCypherOperationField({
                    target: targetEntity,
                    field,
                    context,
                    cypherAttributeField: attribute,
                    cypherArguments,
                });
            }
        }

        return this.createCypherOperationField({
            field,
            context,
            cypherAttributeField: attribute,
            cypherArguments,
        });
    }

    private createConnectionOperation(
        relationship: RelationshipAdapter,
        target: EntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): ConnectionReadOperation | CompositeConnectionReadOperation {
        if (isConcreteEntity(target)) {
            return this.queryASTFactory.operationsFactory.createConnectionOperationAST({
                relationship,
                target,
                resolveTree,
                context,
            });
        }
        return this.queryASTFactory.operationsFactory.createCompositeConnectionOperationAST({
            relationship,
            target,
            resolveTree,
            context,
        });
    }

    private createConnectionField(
        relationship: RelationshipAdapter,
        field: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): OperationField {
        const connectionOp = this.createConnectionOperation(relationship, relationship.target, field, context);

        return new OperationField({
            operation: connectionOp,
            alias: field.alias,
        });
    }

    private createCypherOperationField({
        target,
        field,
        context,
        cypherAttributeField,
        cypherArguments,
    }: {
        target?: EntityAdapter;
        field: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        cypherAttributeField: AttributeAdapter;
        cypherArguments?: Record<string, any>;
    }): OperationField {
        const cypherOp = this.queryASTFactory.operationsFactory.createCustomCypherOperation({
            resolveTree: field,
            context,
            entity: target,
            cypherAttributeField,
            cypherArguments,
        });

        return new OperationField({
            operation: cypherOp,
            alias: field.alias,
        });
    }

    private createRelationshipField({
        relationship,
        field,
        context,
    }: {
        relationship: RelationshipAdapter;
        field: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): OperationField {
        const operation = this.queryASTFactory.operationsFactory.createReadOperation({
            entityOrRel: relationship,
            resolveTree: field,
            context,
        });

        return new OperationField({
            operation,
            alias: field.alias,
        });
    }
}
