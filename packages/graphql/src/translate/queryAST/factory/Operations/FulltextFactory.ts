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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { FulltextScoreField } from "../../ast/fields/FulltextScoreField";
import { FulltextScoreFilter } from "../../ast/filters/property-filters/FulltextScoreFilter";
import type { FulltextOptions } from "../../ast/operations/FulltextOperation";
import { FulltextOperation } from "../../ast/operations/FulltextOperation";
import { FulltextSelection } from "../../ast/selection/FulltextSelection";
import type { QueryASTFactory } from "../QueryASTFactory";

export class FulltextFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createFulltextOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): FulltextOperation {
        let resolveTreeWhere: Record<string, any> = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);
        let sortOptions: Record<string, any> = (resolveTree.args.options as Record<string, any>) || {};
        let fieldsByTypeName = resolveTree.fieldsByTypeName;
        const fulltextOptions = this.getFulltextOptions(context);
        let scoreField: FulltextScoreField | undefined;
        let scoreFilter: FulltextScoreFilter | undefined;

        // Compatibility of top level operations
        const fulltextOperationDeprecatedFields =
            resolveTree.fieldsByTypeName[entity.operations.fulltextTypeNames.result];

        if (fulltextOperationDeprecatedFields) {
            const scoreWhere = resolveTreeWhere.score;
            resolveTreeWhere = resolveTreeWhere[entity.singular] || {};

            const scoreRawField = fulltextOperationDeprecatedFields.score;

            const nestedResolveTree: Record<string, any> = fulltextOperationDeprecatedFields[entity.singular] || {};

            sortOptions = {
                limit: sortOptions.limit,
                offset: sortOptions.offset,
                sort: filterTruthy((sortOptions.sort || []).map((field) => field[entity.singular] || field)),
            };
            fieldsByTypeName = nestedResolveTree.fieldsByTypeName || {};
            if (scoreRawField) {
                scoreField = this.createFulltextScoreField(scoreRawField, fulltextOptions.score);
            }
            if (scoreWhere) {
                scoreFilter = new FulltextScoreFilter({
                    scoreVariable: fulltextOptions.score,
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

        const selection = new FulltextSelection({
            target: entity,
            fulltext: fulltextOptions,
            scoreVariable: fulltextOptions.score,
        });
        const operation = new FulltextOperation({
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
                fulltextOptions.score
            );
            operation.addSort(...sort);

            const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination(sortOptions2);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        return operation;
    }

    public getFulltextSelection(
        entity: ConcreteEntityAdapter,
        context: Neo4jGraphQLTranslationContext
    ): FulltextSelection {
        const fulltextOptions = this.getFulltextOptions(context);
        return new FulltextSelection({
            target: entity,
            fulltext: fulltextOptions,
            scoreVariable: fulltextOptions.score,
        });
    }

    private getFulltextOptions(context: Neo4jGraphQLTranslationContext): FulltextOptions {
        if (context.fulltext) {
            const indexName = context.fulltext.indexName ?? context.fulltext.name;
            if (indexName === undefined) {
                throw new Error("The name of the fulltext index should be defined using the indexName argument.");
            }
            const phrase = context.resolveTree.args.phrase;
            if (!phrase || typeof phrase !== "string") {
                throw new Error("Invalid phrase");
            }

            return {
                index: indexName,
                phrase,
                score: context.fulltext.scoreVariable,
            };
        }

        const entries = Object.entries(context.resolveTree.args.fulltext || {});
        if (entries.length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        const [indexName, indexInput] = entries[0] as [string, { phrase: string }];
        return {
            index: indexName,
            phrase: indexInput.phrase,
            score: new Cypher.Variable(),
        };
    }

    private createFulltextScoreField(field: ResolveTree, scoreVar: Cypher.Variable): FulltextScoreField {
        return new FulltextScoreField({
            alias: field.alias,
            score: scoreVar,
        });
    }
}
