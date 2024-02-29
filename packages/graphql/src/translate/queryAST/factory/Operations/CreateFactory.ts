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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { CreateOperation } from "../../ast/operations/CreateOperation";
import type { ReadOperation } from "../../ast/operations/ReadOperation";
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
}
