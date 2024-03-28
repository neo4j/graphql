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

import Cypher from "@neo4j/cypher-builder";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { Neo4jGraphQLError } from "../../../../classes";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { asArray } from "../../../../utils/utils";
import { MutationOperationField } from "../../ast/input-fields/MutationOperationField";
import { ReferenceInputField } from "../../ast/input-fields/ReferenceInputField";
import { CreateOperation } from "../../ast/operations/CreateOperation";
import type { ReadOperation } from "../../ast/operations/ReadOperation";
import { UnwindCreateOperation } from "../../ast/operations/UnwindCreateOperation";
import { assertIsConcreteEntity, isConcreteEntity } from "../../utils/is-concrete-entity";
import type { QueryASTFactory } from "../QueryASTFactory";

export class CreateFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createCreateOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): CreateOperation {
        const responseFields = Object.values(
            resolveTree.fieldsByTypeName[entity.operations.mutationResponseTypeNames.create] ?? {}
        );
        const createOP = new CreateOperation({ target: entity });
        const projectionFields = responseFields
            .filter((f) => f.name === entity.plural)
            .map((field) => {
                const readOP = this.queryASTFactory.operationsFactory.createReadOperation({
                    entityOrRel: entity,
                    resolveTree: field,
                    context,
                }) as ReadOperation;
                return readOP;
            });

        createOP.addProjectionOperations(projectionFields);
        return createOP;
    }

    public createUnwindCreateOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): UnwindCreateOperation {
        const responseFields = Object.values(
            resolveTree.fieldsByTypeName[entity.operations.mutationResponseTypeNames.create] ?? {}
        );
        const rawInput = resolveTree.args.input as Record<string, any>[];

        const unwindCreate = this.parseTopLevelUnwindCreate({ entity, input: rawInput ?? [], context });

        const projectionFields = responseFields
            .filter((f) => f.name === entity.plural)
            .map((field) => {
                return this.queryASTFactory.operationsFactory.createReadOperation({
                    entityOrRel: entity,
                    resolveTree: field,
                    context,
                }) as ReadOperation;
            });

        unwindCreate.addProjectionOperations(projectionFields);
        return unwindCreate;
    }

    private parseTopLevelUnwindCreate({
        entity,
        input,
        context,
    }: {
        entity: ConcreteEntityAdapter;
        input: Record<string, any>[];
        context: Neo4jGraphQLTranslationContext;
    }): UnwindCreateOperation {
        const rawInputParam = new Cypher.Param(input);
        const unwindCreate = new UnwindCreateOperation({ target: entity, argumentToUnwind: rawInputParam });
        this.hydrateTopLevelCreateUnwindOperation({ entity, input, unwindCreate, context });

        return unwindCreate;
    }

    private parseNestedLevelUnwindCreate({
        input,
        relationship,
        context,
        unwindVariable,
    }: {
        relationship: RelationshipAdapter;
        input: Record<string, any>[];
        unwindVariable: Cypher.Property;

        context: Neo4jGraphQLTranslationContext;
    }): UnwindCreateOperation {
        const unwindCreate = new UnwindCreateOperation({
            target: relationship,
            argumentToUnwind: unwindVariable,
        });
        this.hydrateNestedLevelCreateUnwindOperation({ relationship, input, unwindCreate, context });

        return unwindCreate;
    }

    public hydrateTopLevelCreateUnwindOperation({
        entity,
        input,
        unwindCreate,
        context,
    }: {
        entity: ConcreteEntityAdapter;
        input: Record<string, any>[];
        unwindCreate: UnwindCreateOperation;
        context: Neo4jGraphQLTranslationContext;
    }) {
        this.addEntityAuthorization({ entity, context, unwindCreate });
        asArray(input).forEach((inputItem) => {
            this.raiseAttributeAmbiguity(Object.keys(inputItem ?? {}), entity);
            for (const key of Object.keys(inputItem)) {
                const relationship = entity.relationships.get(key);
                const attribute = entity.attributes.get(key);
                if (attribute) {
                    if (!unwindCreate.getField(key)) {
                        this.addAttributeAuthorization({
                            attribute,
                            entity,
                            context,
                            unwindCreate,
                            conditionForEvaluation: Cypher.isNotNull(unwindCreate.getUnwindVariable().property(key)),
                        });
                        const literalInputField = new ReferenceInputField({
                            attribute,
                            reference: unwindCreate.getUnwindVariable().property(key),
                        });
                        unwindCreate.addField(literalInputField);
                    }
                } else if (relationship) {
                    const nestedEntity = relationship.target;
                    assertIsConcreteEntity(nestedEntity); // unwind is not available for abstract types and this should be have been checked by isUnwindCreateSupported
                    const relField = unwindCreate.getField(key);
                    if (!relField) {
                        const nestedCreate = inputItem[key].create;
                        if (nestedCreate) {
                            const nestedUnwind = this.parseNestedLevelUnwindCreate({
                                relationship: relationship,
                                input: nestedCreate,
                                unwindVariable: unwindCreate
                                    .getUnwindVariable()
                                    .property(relationship.name)
                                    .property("create"),
                                context,
                            });
                            const mutationOperationField = new MutationOperationField(key, nestedUnwind);
                            unwindCreate.addField(mutationOperationField);
                        } else {
                            throw new Error(`Expected create operation, but found: ${key}`);
                        }
                    } else {
                        if (
                            relField instanceof MutationOperationField &&
                            relField.mutationOperation instanceof UnwindCreateOperation
                        ) {
                            this.hydrateNestedLevelCreateUnwindOperation({
                                relationship,
                                input: inputItem[key].create,
                                unwindCreate: relField.mutationOperation,
                                context,
                            });
                        } else {
                            throw new Error(
                                `Transpile Error: Unwind create optimization failed when trying to hydrate nested level create operation for ${key}`
                            );
                        }
                    }
                } else {
                    throw new Error(`Transpile Error: Input field ${key} not found in entity ${entity.name}`);
                }
            }
        });
    }

    private hydrateNestedLevelCreateUnwindOperation({
        relationship,
        input,
        unwindCreate,
        context,
    }: {
        relationship: RelationshipAdapter;
        input: Record<string, any>[];
        unwindCreate: UnwindCreateOperation;
        context: Neo4jGraphQLTranslationContext;
    }) {
        const entity = relationship.target;
        assertIsConcreteEntity(entity);
        this.addEntityAuthorization({ entity, context, unwindCreate });
        asArray(input).forEach((inputItem) => {
            this.raiseAttributeAmbiguity(Object.keys(inputItem.node ?? {}), entity);
            this.raiseAttributeAmbiguity(Object.keys(inputItem.edge ?? {}), relationship);
            // do for node properties
            for (const key of Object.keys(inputItem.node ?? {})) {
                const relationship = entity.relationships.get(key);
                const attribute = entity.attributes.get(key);
                if (attribute) {
                    if (!unwindCreate.getField(key)) {
                        this.addAttributeAuthorization({
                            attribute,
                            entity,
                            context,
                            unwindCreate,
                            conditionForEvaluation: Cypher.isNotNull(unwindCreate.getUnwindVariable().property("node").property(key)),
                        });
                        const literalInputField = new ReferenceInputField({
                            attribute,
                            reference: unwindCreate.getUnwindVariable().property("node").property(key),
                        });
                        unwindCreate.addField(literalInputField);
                    }
                } else if (relationship) {
                    const nestedEntity = relationship.target;
                    assertIsConcreteEntity(nestedEntity); // unwind is not available for abstract types and this should be have been checked by isUnwindCreateSupported
                    const relField = unwindCreate.getField(key);
                    if (!relField) {
                        const nestedCreate = inputItem?.node[key]?.create;
                        if (nestedCreate) {
                            const nestedUnwind = this.parseNestedLevelUnwindCreate({
                                relationship: relationship,
                                input: nestedCreate,
                                unwindVariable: unwindCreate
                                    .getUnwindVariable()
                                    .property("node")
                                    .property(relationship.name)
                                    .property("create"),
                                context,
                            });
                            const mutationOperationField = new MutationOperationField(key, nestedUnwind);
                            unwindCreate.addField(mutationOperationField);
                        } else {
                            throw new Error(`Expected create operation, but found: ${key}`);
                        }
                    } else {
                        if (
                            relField instanceof MutationOperationField &&
                            relField.mutationOperation instanceof UnwindCreateOperation
                        ) {
                            const nestedCreate = inputItem?.node[key]?.create;
                            this.hydrateNestedLevelCreateUnwindOperation({
                                relationship,
                                input: nestedCreate,
                                unwindCreate: relField.mutationOperation,
                                context,
                            });
                        } else {
                            throw new Error(
                                `Transpile Error: Unwind create optimization failed when trying to hydrate nested level create operation for ${key}`
                            );
                        }
                    }
                } else {
                    throw new Error(`Transpile Error: Input field ${key} not found in entity ${entity.name}`);
                }
            }
            // do it for edge properties
            for (const key of Object.keys(inputItem.edge ?? {})) {
                const attribute = relationship.attributes.get(key);
                if (attribute) {
                    const literalInputField = new ReferenceInputField({
                        attribute,
                        reference: unwindCreate.getUnwindVariable().property("edge").property(key),
                        attachedTo: "relationship",
                    });
                    unwindCreate.addField(literalInputField);
                }
            }
        });
    }

    private raiseAttributeAmbiguity(
        properties: Set<string> | Array<string>,
        entity: ConcreteEntityAdapter | RelationshipAdapter
    ) {
        const hash = {};
        properties.forEach((property) => {
            if (isConcreteEntity(entity) && entity.relationships.get(property)) {
                return;
            }
            const dbName = entity.findAttribute(property)?.databaseName;
            if (dbName === undefined) {
                throw new Error(
                    `Transpile Error: Impossible to translate property ${property} on entity ${entity.name}`
                );
            }
            if (hash[dbName]) {
                throw new Neo4jGraphQLError(
                    `Conflicting modification of ${[hash[dbName], property]
                        .map((n) => `[[${n}]]`)
                        .join(", ")} on type ${entity.name}`
                );
            }
            hash[dbName] = property;
        });
    }

    private addEntityAuthorization({
        entity,
        context,
        unwindCreate,
    }: {
        entity: ConcreteEntityAdapter;
        context: Neo4jGraphQLTranslationContext;
        unwindCreate: UnwindCreateOperation;
    }): void {
        const authFilters = this.queryASTFactory.authorizationFactory.createAuthValidateRule({
            entity,
            authAnnotation: entity.annotations.authorization,
            when: "AFTER",
            operations: ["CREATE"],
            context,
        });
        if (authFilters) {
            unwindCreate.addAuthFilters(authFilters);
        }
    }

    private addAttributeAuthorization({
        attribute,
        context,
        unwindCreate,
        entity,
        conditionForEvaluation,
    }: {
        attribute: AttributeAdapter;
        context: Neo4jGraphQLTranslationContext;
        unwindCreate: UnwindCreateOperation;
        entity: ConcreteEntityAdapter;
        conditionForEvaluation?: Cypher.Predicate;
    }): void {
        const attributeAuthorization = this.queryASTFactory.authorizationFactory.createAuthValidateRule({
            entity,
            when: "AFTER",
            authAnnotation: attribute.annotations.authorization,
            conditionForEvaluation,
            operations: ["CREATE"],
            context,
        });
        if (attributeAuthorization) {
            unwindCreate.addAuthFilters(attributeAuthorization);
        }
    }
}
