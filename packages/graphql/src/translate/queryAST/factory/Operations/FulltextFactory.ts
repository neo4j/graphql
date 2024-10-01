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
import { asArray } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { ScoreField } from "../../ast/fields/ScoreField";
import { ScoreFilter } from "../../ast/filters/property-filters/ScoreFilter";
import type { FulltextOptions } from "../../ast/operations/FulltextOperation";
import { FulltextOperation } from "../../ast/operations/FulltextOperation";
import { FulltextSelection } from "../../ast/selection/FulltextSelection";
import type { QueryASTFactory } from "../QueryASTFactory";

export class FulltextFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }
    /**
     * @deprecated This method is deprecated an it will be removed when the deprecate fulltext operation will be removed.
     * The is the factory method that parse the deprecated syntax as movies(fulltext: { phrase: "The Matrix" }) {...}
     * To parse the new syntax movieFullText(phrase: "The Matrix") {...} use the method createFulltextOperation
     *
     **/
    public createDeprecatedFulltextOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): FulltextOperation {
        const resolveTreeWhere: Record<string, any> = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);

        const fieldsByTypeName = resolveTree.fieldsByTypeName;
        const fullTextOptions = this.getFulltextOptions(context);
        let scoreField: ScoreField | undefined;
        let scoreFilter: ScoreFilter | undefined;

        checkEntityAuthentication({
            entity: entity.entity,
            targetOperations: ["READ"],
            context,
        });

        const selection = new FulltextSelection({
            target: entity,
            fulltext: fullTextOptions,
            scoreVariable: fullTextOptions.score,
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
        // SOFT_DEPRECATION: OPTIONS-ARGUMENT
        // SOFT_DEPRECATION: OPTIONS-ARGUMENT
        const optionsArg: Record<string, any> = (resolveTree.args.options ?? {}) as Record<string, any>;
        const sortArg = resolveTree.args.sort ?? optionsArg.sort;
        const limitArg = resolveTree.args.limit ?? optionsArg.limit;
        const offsetArg = resolveTree.args.offset ?? optionsArg.offset;
        const paginationOptions = this.queryASTFactory.operationsFactory.getOptions({
            entity,
            limitArg,
            offsetArg,
            sortArg,
        });

        if (paginationOptions) {
            const sort = this.queryASTFactory.sortAndPaginationFactory.createSortFields(
                paginationOptions,
                entity,
                context,
                fullTextOptions.score
            );
            operation.addSort(...sort);

            const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination(paginationOptions);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        return operation;
    }

    public createFulltextOperation(
        entity: ConcreteEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): FulltextOperation {
        const fullTextDeprecateOperationFields =
            resolveTree.fieldsByTypeName[entity.operations.fulltextTypeNames.result];

        if (!fullTextDeprecateOperationFields) {
            throw new Error("Transpile error: operation not found");
        }
        const resolveTreeWhere: Record<string, any> = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);

        const fullTextOptions = this.getFulltextOptions(context);
        let scoreField: ScoreField | undefined;
        let scoreFilter: ScoreFilter | undefined;

        const scoreWhere = resolveTreeWhere.score;
        const targetTypeWhere = resolveTreeWhere[entity.singular] ?? {};

        const scoreRawField = fullTextDeprecateOperationFields.score;

        const nestedResolveTree: Record<string, any> = fullTextDeprecateOperationFields[entity.singular] ?? {};

        if (scoreRawField) {
            scoreField = new ScoreField({
                alias: scoreRawField.alias,
                score: fullTextOptions.score,
            });
        }
        if (scoreWhere) {
            scoreFilter = new ScoreFilter({
                scoreVariable: fullTextOptions.score,
                min: scoreWhere.min,
                max: scoreWhere.max,
            });
        }

        checkEntityAuthentication({
            entity: entity.entity,
            targetOperations: ["READ"],
            context,
        });

        const selection = new FulltextSelection({
            target: entity,
            fulltext: fullTextOptions,
            scoreVariable: fullTextOptions.score,
        });
        const operation = new FulltextOperation({
            target: entity,
            scoreField,
            selection,
        });

        if (scoreFilter) {
            operation.addFilters(scoreFilter);
        }
        const fieldsByTypeName = nestedResolveTree.fieldsByTypeName ?? {};
        this.queryASTFactory.operationsFactory.hydrateOperation({
            operation,
            entity,
            fieldsByTypeName,
            context,
            whereArgs: targetTypeWhere,
        });

        // SOFT_DEPRECATION: OPTIONS-ARGUMENT
        const optionsArg: Record<string, any> = (resolveTree.args.options ?? {}) as Record<string, any>;
        // Override sort to support score and other fields as: { score: "DESC", movie: { title: DESC }}
        const sortArg = asArray(resolveTree.args.sort ?? optionsArg.sort).map(
            (field) => field[entity.singular] ?? field
        );
        const limitArg = resolveTree.args.limit ?? optionsArg.limit;
        const offsetArg = resolveTree.args.offset ?? optionsArg.offset;

        const paginationOptions = this.queryASTFactory.operationsFactory.getOptions({
            entity,
            limitArg,
            offsetArg,
            sortArg,
        });

        if (paginationOptions) {
            const sort = this.queryASTFactory.sortAndPaginationFactory.createSortFields(
                paginationOptions,
                entity,
                context,
                fullTextOptions.score
            );
            operation.addSort(...sort);

            const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination(paginationOptions);
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
}
