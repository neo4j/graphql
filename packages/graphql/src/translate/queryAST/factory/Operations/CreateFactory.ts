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

        const unwindCreate = this.parseUnwindCreate({ entityOrRel: entity, input: rawInput ?? [], context });

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

    private parseUnwindCreate({
        entityOrRel,
        input,
        context,
        unwindVariable = new Cypher.Param(input),
    }: {
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter;
        input: Record<string, any>[];
        context: Neo4jGraphQLTranslationContext;

        unwindVariable?: Cypher.Property | Cypher.Param;
    }): UnwindCreateOperation {
        const unwindCreate = new UnwindCreateOperation({ target: entityOrRel, argumentToUnwind: unwindVariable });
        this.hydrateUnwindCreateOperation({ entityOrRel: entityOrRel, input, unwindCreate, context });

        return unwindCreate;
    }

    private hydrateUnwindCreateOperation({
        entityOrRel,
        input,
        unwindCreate,
        context,
    }: {
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter;
        input: Record<string, any>[];
        unwindCreate: UnwindCreateOperation;
        context: Neo4jGraphQLTranslationContext;
    }) {
        const isNested = !isConcreteEntity(entityOrRel);
        const nestedTarget = isNested ? entityOrRel.target : entityOrRel;
        assertIsConcreteEntity(nestedTarget);
        this.addEntityAuthorization({ entity: nestedTarget, context, unwindCreate });
        const unwindVariable = unwindCreate.getUnwindVariable();
        asArray(input).forEach((inputItem) => {
            if (isNested) {
                this.raiseAttributeAmbiguity(Object.keys(inputItem.node ?? {}), nestedTarget);
                this.raiseAttributeAmbiguity(Object.keys(inputItem.edge ?? {}), entityOrRel);
            } else {
                this.raiseAttributeAmbiguity(Object.keys(inputItem ?? {}), nestedTarget);
            }
            const targetInput = isNested ? inputItem["node"] ?? {} : inputItem ?? {};
            for (const key of Object.keys(targetInput)) {
                const relationship = nestedTarget.relationships.get(key);
                const attribute = nestedTarget.attributes.get(key);
                if (attribute) {
                    const path = isNested
                        ? unwindVariable.property("node").property(key)
                        : unwindVariable.property(key);
                    this.addAttributeInputFieldToUnwindOperation({
                        entity: nestedTarget,
                        attribute,
                        unwindCreate,
                        context,
                        path,
                        attachedTo: "node",
                    });
                } else if (relationship) {
                    const nestedEntity = relationship.target;
                    assertIsConcreteEntity(nestedEntity);
                    const relField = unwindCreate.getField(key);
                    const nestedCreateInput = isNested ? inputItem?.node[key]?.create : inputItem[key].create;
                    if (!relField) {
                        const partialPath = isNested ? unwindVariable.property("node") : unwindVariable;
                        this.addRelationshipInputFieldToUnwindOperation({
                            relationship,
                            unwindCreate,
                            context,
                            path: partialPath.property(relationship.name).property("create"),
                            nestedCreateInput,
                        });
                    } else {
                        if (
                            !(
                                relField instanceof MutationOperationField &&
                                relField.mutationOperation instanceof UnwindCreateOperation
                            )
                        ) {
                            throw new Error(
                                `Transpile Error: Unwind create optimization failed when trying to hydrate nested level create operation for ${key}`
                            );
                        }
                        this.hydrateUnwindCreateOperation({
                            entityOrRel: relationship,
                            input: nestedCreateInput,
                            unwindCreate: relField.mutationOperation,
                            context,
                        });
                    }
                } else {
                    throw new Error(`Transpile Error: Input field ${key} not found in entity ${nestedTarget.name}`);
                }
            }
            if (isNested) {
                // do it for edge properties
                for (const key of Object.keys(inputItem.edge ?? {})) {
                    const attribute = entityOrRel.attributes.get(key);
                    if (attribute) {
                        this.addAttributeInputFieldToUnwindOperation({
                            entity: nestedTarget,
                            attribute,
                            unwindCreate,
                            context,
                            path: unwindCreate.getUnwindVariable().property("edge").property(key),
                            attachedTo: "relationship",
                        });
                    }
                }
            }
        });
    }

    private addAttributeInputFieldToUnwindOperation({
        entity,
        attribute,
        unwindCreate,
        context,
        path,
        attachedTo,
    }: {
        entity: ConcreteEntityAdapter;
        attribute: AttributeAdapter;
        unwindCreate: UnwindCreateOperation;
        context: Neo4jGraphQLTranslationContext;
        path: Cypher.Property;
        attachedTo: "relationship" | "node";
    }): void {
        if (!unwindCreate.getField(attribute.name)) {
            this.addAttributeAuthorization({
                attribute,
                entity,
                context,
                unwindCreate,
                conditionForEvaluation: Cypher.isNotNull(path),
            });
            const referenceInputField = new ReferenceInputField({
                attribute,
                reference: path,
                attachedTo,
            });
            unwindCreate.addField(referenceInputField);
        }
    }

    private addRelationshipInputFieldToUnwindOperation({
        relationship,
        unwindCreate,
        context,
        path,
        nestedCreateInput,
    }: {
        relationship: RelationshipAdapter;
        unwindCreate: UnwindCreateOperation;
        context: Neo4jGraphQLTranslationContext;
        path: Cypher.Property;
        nestedCreateInput: Record<string, any>[];
    }): void {
        const relField = unwindCreate.getField(relationship.name);
        if (!relField) {
            if (nestedCreateInput) {
                const nestedUnwind = this.parseUnwindCreate({
                    entityOrRel: relationship,
                    input: nestedCreateInput,
                    unwindVariable: path,
                    context,
                });
                const mutationOperationField = new MutationOperationField(relationship.name, nestedUnwind);
                unwindCreate.addField(mutationOperationField);
            } else {
                throw new Error(`Expected create operation, but found: ${relationship.name}`);
            }
        }
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
