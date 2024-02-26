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
import { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { EntityAdapter } from "../../../../schema-model/entity/EntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { TypenameFilter } from "../../ast/filters/property-filters/TypenameFilter";
import { CypherOperation } from "../../ast/operations/CypherOperation";
import { CypherScalarOperation } from "../../ast/operations/CypherScalarOperation";
import { CompositeCypherOperation } from "../../ast/operations/composite/CompositeCypherOperation";
import { CompositeReadPartial } from "../../ast/operations/composite/CompositeReadPartial";
import { CustomCypherSelection } from "../../ast/selection/CustomCypherSelection";
import { NodeSelection } from "../../ast/selection/NodeSelection";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import type { QueryASTFactory } from "../QueryASTFactory";

export class CustomCypherFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createCustomCypherOperation({
        resolveTree,
        context,
        entity,
        cypherAttributeField,
        cypherArguments = {},
    }: {
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        entity?: EntityAdapter;
        cypherAttributeField: AttributeAdapter;
        cypherArguments?: Record<string, any>;
    }): CypherOperation | CompositeCypherOperation | CypherScalarOperation {
        const selection = new CustomCypherSelection({
            operationField: cypherAttributeField,
            rawArguments: cypherArguments,
            isNested: true,
        });
        if (!entity) {
            return new CypherScalarOperation(selection, cypherAttributeField, true);
        }
        if (isConcreteEntity(entity)) {
            const customCypher = new CypherOperation({
                cypherAttributeField: cypherAttributeField,
                target: entity,
                selection,
            });
            return this.queryASTFactory.operationsFactory.hydrateReadOperation({
                entity,
                operation: customCypher,
                resolveTree,
                context,
                whereArgs: {},
            });
        }

        const CypherReadPartials = entity.concreteEntities.map((concreteEntity) => {
            const partialSelection = new NodeSelection({ target: concreteEntity, useContextTarget: true });
            const partial = new CompositeReadPartial({ target: concreteEntity, selection: partialSelection });
            // The Typename filter here is required to access concrete entities from a Cypher Union selection.
            // It would be probably more ergonomic to pass the label filter with the selection,
            // although is currently not possible to do so with Cypher.Builder
            // https://github.com/neo4j/cypher-builder/issues/300
            partial.addFilters(new TypenameFilter([concreteEntity]));
            return this.queryASTFactory.operationsFactory.hydrateReadOperation({
                entity: concreteEntity,
                operation: partial,
                resolveTree,
                context,
                whereArgs: {},
            });
        });
        return new CompositeCypherOperation({ selection, partials: CypherReadPartials });
    }

    public createTopLevelCustomCypherOperation({
        resolveTree,
        context,
        entity,
    }: {
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        entity?: EntityAdapter;
    }): CypherOperation | CompositeCypherOperation | CypherScalarOperation {
        const operationAttribute =
            context.schemaModel.operations.Query?.findAttribute(resolveTree.name) ??
            context.schemaModel.operations.Mutation?.findAttribute(resolveTree.name);

        if (!operationAttribute) {
            throw new Error(`Failed to collect information about the operation field with name: ${resolveTree.name}`);
        }

        const operationField = new AttributeAdapter(operationAttribute);
        const selection = new CustomCypherSelection({
            operationField,
            rawArguments: resolveTree.args,
            isNested: false,
        });
        if (!entity) {
            return new CypherScalarOperation(selection, operationField, false);
        }
        if (isConcreteEntity(entity)) {
            const customCypher = new CypherOperation({
                cypherAttributeField: operationField,
                target: entity,
                selection,
            });
            return this.queryASTFactory.operationsFactory.hydrateReadOperation({
                entity,
                operation: customCypher,
                resolveTree,
                context,
                whereArgs: {},
            });
        }

        const CypherReadPartials = entity.concreteEntities.map((concreteEntity) => {
            const partialSelection = new NodeSelection({ target: concreteEntity, useContextTarget: true });
            const partial = new CompositeReadPartial({ target: concreteEntity, selection: partialSelection });
            // The Typename filter here is required to access concrete entities from a Cypher Union selection.
            // It would be probably more ergonomic to pass the label filter with the selection,
            // although is currently not possible to do so with Cypher.Builder
            // https://github.com/neo4j/cypher-builder/issues/300
            partial.addFilters(new TypenameFilter([concreteEntity]));
            return this.queryASTFactory.operationsFactory.hydrateReadOperation({
                entity: concreteEntity,
                operation: partial,
                resolveTree,
                context,
                whereArgs: {},
            });
        });
        return new CompositeCypherOperation({ selection, partials: CypherReadPartials });
    }
}
