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
import { UpsertSetField } from "../../ast/input-fields/UpsertSetField";
import type { UpsertOperationFields } from "../../ast/operations/UpsertOperation";
import { UpsertOperation } from "../../ast/operations/UpsertOperation";
import { WithSelection } from "../../ast/selection/WithSelection";
import type { QueryASTFactory } from "../QueryASTFactory";

type UpsertInputField = {
    node: Record<string, any>;
    onCreate?: Record<string, any>;
    onUpdate?: Record<string, any>;
};

export class UpsertFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createUpsertOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): UpsertOperation {
        const responseFields = Object.values(
            resolveTree.fieldsByTypeName[entity.operations.mutationResponseTypeNames.upsert] ?? {}
        );

        const inputArg: Array<{
            node: Record<string, any>;
            onCreate?: Record<string, any>;
            onUpdate?: Record<string, any>;
        }> = (resolveTree.args.input as any) ?? [];

        // const input = inputArg[0]!;

        // const setFields = this.createInputFields(entity, input.node);
        // const onCreateFields = this.createInputFields(entity, input.onCreate ?? []);
        // const onUpdateFields = this.createInputFields(entity, input.onUpdate ?? []);

        const upsertOp = new UpsertOperation({ target: entity });
        const projectionFields = responseFields
            .filter((f) => f.name === entity.plural)
            .map((field) => {
                const readOP = this.queryASTFactory.operationsFactory.createReadOperationWithSelection({
                    entity,
                    resolveTree: field,
                    context,
                    selection: new WithSelection(),
                });
                return readOP;
            });

        upsertOp.addProjectionOperations(projectionFields);
        for (const input of inputArg) {
            const operationFields = this.createUpsertOperationFields(entity, input);
            upsertOp.addOperationField(operationFields);
        }
        return upsertOp;
    }

    private createUpsertOperationFields(entity: ConcreteEntityAdapter, input: UpsertInputField): UpsertOperationFields {
        const setFields = this.createInputFields(entity, input.node);
        const onCreateFields = this.createInputFields(entity, input.onCreate ?? []);
        const onUpdateFields = this.createInputFields(entity, input.onUpdate ?? []);

        return {
            setFields,
            onCreateFields,
            onUpdateFields,
        };
    }

    private createInputFields(entity: ConcreteEntityAdapter, fields: Record<string, any>): UpsertSetField[] {
        return Object.entries(fields).map(([key, value]) => {
            const attribute = entity.attributes.get(key);
            if (!attribute) {
                throw new Error(`Attribute ${key} not found`);
            }
            return new UpsertSetField({
                attribute,
                value,
            });
        });
    }
}
