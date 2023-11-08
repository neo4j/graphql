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
import type { ListType } from "../../../schema-model/attribute/AttributeType";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../utils/utils";
import { checkEntityAuthentication } from "../../authorization/check-authentication";
import type { Field } from "../ast/fields/Field";
import { OperationField } from "../ast/fields/OperationField";
import { AggregationAttributeField } from "../ast/fields/aggregation-fields/AggregationAttributeField";
import type { AggregationField } from "../ast/fields/aggregation-fields/AggregationField";
import { CountField } from "../ast/fields/aggregation-fields/CountField";
import { AttributeField } from "../ast/fields/attribute-fields/AttributeField";
import { CypherAttributeField } from "../ast/fields/attribute-fields/CypherAttributeField";
import { CypherUnionAttributeField } from "../ast/fields/attribute-fields/CypherUnionAttributeField";
import { CypherUnionAttributePartial } from "../ast/fields/attribute-fields/CypherUnionAttributePartial";
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
            if (isConcreteEntity(entity)) {
                // TODO: Move this to the tree
                checkEntityAuthentication({
                    entity: entity.entity,
                    targetOperations: ["READ"],
                    context,
                    field: field.name,
                });
            }
            const { fieldName, isConnection, isAggregation } = parseSelectionSetField(field.name);

            if (isConnection) {
                if (entity instanceof RelationshipAdapter)
                    throw new Error("Cannot create connection field of relationship");
                return this.createConnectionField(entity, fieldName, field, context);
            }

            if (isAggregation) {
                if (entity instanceof RelationshipAdapter)
                    throw new Error("Cannot create aggregation field of relationship");

                const relationship = entity.findRelationship(fieldName);
                if (!relationship) throw new Error("Relationship for aggregation not found");

                return this.createRelationshipAggregationField(relationship, fieldName, field, context);
            }

            if (isConcreteEntity(entity)) {
                const relationship = entity.findRelationship(fieldName);
                if (relationship) {
                    return this.createRelationshipField({ relationship, field, context });
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
        fieldName: string,
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
        rawFields: Record<string, ResolveTree>,
        topLevel: boolean
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
                    if (!attribute) throw new Error(`Attribute ${field.name} not found`);

                    const aggregateFields =
                        field.fieldsByTypeName[attribute.getAggregateSelectionTypeName(false)] ||
                        field.fieldsByTypeName[attribute.getAggregateSelectionTypeName(true)] ||
                        {};

                    const aggregationProjection = Object.values(aggregateFields).reduce((acc, f) => {
                        acc[f.name] = f.alias;
                        return acc;
                    }, {});

                    return new AggregationAttributeField({
                        attribute,
                        alias: field.alias,
                        aggregationProjection,
                        useReduce: topLevel,
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
        if (!attribute) return undefined;

        const customResolver = attribute.annotations.customResolver;
        if (!customResolver) {
            return undefined;
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
    }): AttributeField | undefined {
        if (["cursor", "node"].includes(fieldName)) return;
        let attribute = entity.findAttribute(fieldName);

        if (fieldName === "id" && !attribute && isConcreteEntity(entity)) {
            attribute = entity.globalIdField;
            if (!attribute) throw new Error(`attribute ${fieldName} not found`);
            return new AttributeField({ alias: attribute.name, attribute });
        }

        if (!attribute) throw new Error(`attribute ${fieldName} not found`);

        if (attribute.annotations.cypher) {
            return this.createCypherAttributeField({
                field,
                attribute,
                context,
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
    }: {
        attribute: AttributeAdapter;
        field: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): CypherAttributeField {
        const cypherAnnotation = attribute.annotations.cypher;
        if (!cypherAnnotation) throw new Error("@Cypher directive missing");
        const typeName = attribute.typeHelper.isList() ? (attribute.type as ListType).ofType.name : attribute.type.name;
        const rawFields = field.fieldsByTypeName[typeName];
        let cypherProjection: Record<string, string> | undefined;
        let nestedFields: Field[] | undefined;
        const extraParams: Record<string, any> = {};

        if (cypherAnnotation.statement.includes("$jwt") && context.authorization.jwtParam) {
            extraParams.jwt = context.authorization.jwtParam.value;
        }

        if (rawFields) {
            cypherProjection = Object.values(rawFields).reduce((acc, f) => {
                acc[f.alias] = f.name;
                return acc;
            }, {});
            // if the attribute is an object or an abstract type we may have nested fields
            if (attribute.typeHelper.isAbstract() || attribute.typeHelper.isObject()) {
                // TODO: this code block could be handled directly in the schema model or in some schema model helper
                const targetEntity = this.queryASTFactory.schemaModel.getEntity(typeName);
                // Raise an error as we expect that any complex attributes type are always entities
                if (!targetEntity) throw new Error(`Entity ${typeName} not found`);
                if (targetEntity.isConcreteEntity()) {
                    const concreteEntityAdapter = new ConcreteEntityAdapter(targetEntity);
                    nestedFields = this.createFields(concreteEntityAdapter, rawFields, context);
                } else if (targetEntity.isCompositeEntity()) {
                    const concreteEntities = targetEntity.concreteEntities.map((e) => new ConcreteEntityAdapter(e));
                    const nestedUnionFields = concreteEntities.flatMap((concreteEntity) => {
                        const concreteEntityFields = field.fieldsByTypeName[concreteEntity.name];
                        const unionNestedFields = this.createFields(
                            concreteEntity,
                            { ...rawFields, ...concreteEntityFields },
                            context
                        );

                        return [
                            new CypherUnionAttributePartial({
                                fields: unionNestedFields,
                                target: concreteEntity,
                            }),
                        ];
                    });

                    return new CypherUnionAttributeField({
                        attribute,
                        alias: field.alias,
                        projection: cypherProjection,
                        rawArguments: field.args,
                        unionPartials: nestedUnionFields,
                        extraParams,
                    });
                }
            }
        }

        return new CypherAttributeField({
            attribute,
            alias: field.alias,
            projection: cypherProjection,
            nestedFields,
            rawArguments: field.args,
            extraParams,
        });
    }

    private createConnectionField(
        entity: ConcreteEntityAdapter,
        fieldName: string,
        field: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): OperationField {
        const relationship = entity.findRelationship(fieldName);
        if (!relationship) throw new Error(`Relationship ${fieldName} not found in entity ${entity.name}`);
        const target = relationship.target;
        let connectionOp: ConnectionReadOperation | CompositeConnectionReadOperation;
        if (isConcreteEntity(target)) {
            connectionOp = this.queryASTFactory.operationsFactory.createConnectionOperationAST({
                relationship,
                target,
                resolveTree: field,
                context,
            });
        } else {
            connectionOp = this.queryASTFactory.operationsFactory.createCompositeConnectionOperationAST({
                relationship,
                target,
                resolveTree: field,
                context,
            });
        }

        return new OperationField({
            operation: connectionOp,
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
        const operation = this.queryASTFactory.operationsFactory.createReadOperation(relationship, field, context);

        return new OperationField({
            operation,
            alias: field.alias,
        });
    }
}
