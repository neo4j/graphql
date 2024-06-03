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

import type Cypher from "@neo4j/cypher-builder";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { ScoreField } from "../../ast/fields/ScoreField";
import { ScoreFilter } from "../../ast/filters/property-filters/ScoreFilter";
import type { VectorOptions } from "../../ast/operations/VectorOperation";
import { VectorOperation } from "../../ast/operations/VectorOperation";
import { VectorSelection } from "../../ast/selection/VectorSelection";
import type { QueryASTFactory } from "../QueryASTFactory";

export class VectorFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createVectorOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): VectorOperation {
        let resolveTreeWhere: Record<string, any> = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);
        let sortOptions: Record<string, any> = (resolveTree.args.options as Record<string, any>) || {};
        let fieldsByTypeName = resolveTree.fieldsByTypeName;
        const vectorOptions = this.getVectorOptions(context);
        let scoreField: ScoreField | undefined;
        let scoreFilter: ScoreFilter | undefined;

        // Compatibility of top level operations
        const vectorOperationDeprecatedFields = resolveTree.fieldsByTypeName[entity.operations.vectorTypeNames.result];

        if (vectorOperationDeprecatedFields) {
            const scoreWhere = resolveTreeWhere.score;
            resolveTreeWhere = resolveTreeWhere[entity.singular] || {};

            const scoreRawField = vectorOperationDeprecatedFields.score;

            const nestedResolveTree: Record<string, any> = vectorOperationDeprecatedFields[entity.singular] || {};

            sortOptions = {
                limit: sortOptions.limit,
                offset: sortOptions.offset,
                sort: filterTruthy((sortOptions.sort || []).map((field) => field[entity.singular] || field)),
            };
            fieldsByTypeName = nestedResolveTree.fieldsByTypeName || {};
            if (scoreRawField) {
                scoreField = this.createVectorScoreField(scoreRawField, vectorOptions.score);
            }
            if (scoreWhere) {
                scoreFilter = new ScoreFilter({
                    scoreVariable: vectorOptions.score,
                    min: scoreWhere.min,
                    max: scoreWhere.max,
                });
            }
        }

        checkEntityAuthentication({
            entity: entity.entity,
            targetOperations: ["READ"],
            context,
        });

        const selection = new VectorSelection({
            target: entity,
            vector: vectorOptions,
            scoreVariable: vectorOptions.score,
            settings: context.vector?.vectorSettings,
        });
        const operation = new VectorOperation({
            target: entity,
            scoreField,
            selection,
        });

        if (scoreFilter) {
            operation.addFilters(scoreFilter);
        }

        this.queryASTFactory.operationsFactory.hydrateOperation({
            operation,
            entity,
            fieldsByTypeName: fieldsByTypeName,
            context,
            whereArgs: resolveTreeWhere,
        });

        // Override sort to support score
        const sortOptions2 = this.queryASTFactory.operationsFactory.getOptions(entity, sortOptions);

        if (sortOptions2) {
            const sort = this.queryASTFactory.sortAndPaginationFactory.createSortFields(
                sortOptions2,
                entity,
                context,
                vectorOptions.score
            );
            operation.addSort(...sort);

            const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination(sortOptions2);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        return operation;
    }

    public getVectorSelection(entity: ConcreteEntityAdapter, context: Neo4jGraphQLTranslationContext): VectorSelection {
        const vectorOptions = this.getVectorOptions(context);
        return new VectorSelection({
            target: entity,
            vector: vectorOptions,
            scoreVariable: vectorOptions.score,
        });
    }

    private getVectorOptions(context: Neo4jGraphQLTranslationContext): VectorOptions {
        if (!context.vector) {
            throw new Error("Vector context is missing");
        }

        if (context.resolveTree.args.vector) {
            const vector = context.resolveTree.args.vector;

            if (!Array.isArray(vector)) {
                throw new Error("Invalid vector");
            }

            if (!vector.every((v) => typeof v === "number")) {
                throw new Error("Invalid vector");
            }

            return {
                index: context.vector.index,
                vector,
                score: context.vector.scoreVariable,
            };
        }

        const phrase = context.resolveTree.args.phrase;
        if (!phrase || typeof phrase !== "string") {
            throw new Error("Invalid phrase");
        }

        return {
            index: context.vector.index,
            phrase,
            score: context.vector.scoreVariable,
        };

        // const entries = Object.entries(context.resolveTree.args.vector || {});
        // if (entries.length > 1) {
        //     throw new Error("Can only call one search at any given time");
        // }
        // const [indexName, indexInput] = entries[0] as [string, { phrase: string }];
        // return {
        //     index: indexName,
        //     phrase: indexInput.phrase,
        //     score: new Cypher.Variable(),
        // };
    }

    private createVectorScoreField(field: ResolveTree, scoreVar: Cypher.Variable): ScoreField {
        return new ScoreField({
            alias: field.alias,
            score: scoreVar,
        });
    }
}
