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
import type { Field } from "../ast/fields/Field";
import { parseSelectionSetField } from "./parsers/parse-selection-set-fields";
import type { QueryASTFactory } from "./QueryASTFactory";
import { PointAttributeField } from "../ast/fields/attribute-fields/PointAttributeField";
import { AttributeField } from "../ast/fields/attribute-fields/AttributeField";
import { DateTimeField } from "../ast/fields/attribute-fields/DateTimeField";
import type { AggregationField } from "../ast/fields/aggregation-fields/AggregationField";
import { CountField } from "../ast/fields/aggregation-fields/CountField";
import { filterTruthy } from "../../../utils/utils";
import { AggregationAttributeField } from "../ast/fields/aggregation-fields/AggregationAttributeField";
import { OperationField } from "../ast/fields/OperationField";
import { CypherAttributeField } from "../ast/fields/attribute-fields/CypherAttributeField";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import { mergeDeep } from "@graphql-tools/utils";
import { CypherUnionAttributePartial } from "../ast/fields/attribute-fields/CypherUnionAttributePartial";
import { CypherUnionAttributeField } from "../ast/fields/attribute-fields/CypherUnionAttributeField";
import { checkEntityAuthentication } from "../../authorization/check-authentication";

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

        const fields = Object.values(mergedFields).flatMap((field: ResolveTree): Field[] | Field => {
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
                    return this.createRelationshipField(entity, relationship, fieldName, field, context);
                }
            }

            return this.createAttributeField({
                entity,
                fieldName,
                field,
                context,
            });
        });

        return fields;
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
        entity: ConcreteEntityAdapter | RelationshipAdapter,
        rawFields: Record<string, ResolveTree>
        // context: Neo4jGraphQLTranslationContext
    ): AggregationField[] {
        return filterTruthy(
            Object.values(rawFields).map((field) => {
                // if (isConcreteEntity(entity)) {
                //     // TODO: Move this to the tree
                //     checkEntityAuthentication({
                //         entity: entity.entity,
                //         targetOperations: ["AGGREGATE"],
                //         context,
                //         field: field.name,
                //     });
                // }
                // if (entity instanceof RelationshipAdapter && isConcreteEntity(entity.target)) {
                //     // TODO: Move this to the tree
                //     checkEntityAuthentication({
                //         entity: entity.target.entity,
                //         targetOperations: ["AGGREGATE"],
                //         context,
                //         field: field.name,
                //     });
                // }

                if (field.name === "count") {
                    return new CountField({
                        alias: field.alias,
                        entity: entity as any,
                    });
                } else {
                    const attribute = entity.findAttribute(field.name);
                    if (!attribute) throw new Error(`Attribute ${field.name} not found`);
                    return new AggregationAttributeField({
                        attribute,
                        alias: field.alias,
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
    }): AttributeField {
        let attribute = entity.findAttribute(fieldName);

        if (fieldName === "id" && !attribute && isConcreteEntity(entity)) {
            attribute = entity.globalIdField;
            if (!attribute) throw new Error(`attribute ${fieldName} not found`);

            // NOTE: for some reason, the alias needs to be the same as the database name
            return new AttributeField({ alias: attribute.databaseName, attribute });
        }

        if (!attribute) throw new Error(`attribute ${fieldName} not found`);

        if (attribute.annotations.cypher) {
            return this.createCypherAttributeField({
                entity,
                fieldName,
                field,
                attribute,
                context,
            });
        }

        if (attribute.isPoint()) {
            const typeName = attribute.isList() ? attribute.type.ofType.name : attribute.type.name;
            const { crs } = field.fieldsByTypeName[typeName] as any;
            return new PointAttributeField({
                attribute,
                alias: field.alias,
                crs: Boolean(crs),
            });
        }

        if (attribute.isDateTime()) {
            return new DateTimeField({
                attribute,
                alias: field.alias,
            });
        }

        return new AttributeField({ alias: field.alias, attribute });
    }

    private createCypherAttributeField({
        entity,
        fieldName,
        field,
        attribute,
        context,
    }: {
        entity: ConcreteEntityAdapter | RelationshipAdapter;
        attribute: AttributeAdapter;
        fieldName: string;
        field: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): CypherAttributeField {
        const cypherAnnotation = attribute.annotations.cypher;
        if (!cypherAnnotation) throw new Error("@Cypher directive missing");
        const typeName = attribute.isList() ? attribute.type.ofType.name : attribute.type.name;
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
            if (attribute.isAbstract() || attribute.isObject()) {
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
        if (!relationship) throw new Error(`Relationship  ${fieldName} not found in entity ${entity.name}`);
        const connectionOp = this.queryASTFactory.operationsFactory.createConnectionOperationAST(
            relationship,
            field,
            context
        );

        return new OperationField({
            operation: connectionOp,
            alias: field.alias,
        });
    }

    private createRelationshipField(
        entity: ConcreteEntityAdapter,
        relationship: RelationshipAdapter,
        fieldName: string,
        field: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): OperationField {
        const operation = this.queryASTFactory.operationsFactory.createReadOperationAST(relationship, field, context);

        return new OperationField({
            operation,
            alias: field.alias,
        });
    }
}
