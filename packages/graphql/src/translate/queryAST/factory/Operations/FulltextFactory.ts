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
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { ScoreField } from "../../ast/fields/ScoreField";
import { ScoreFilter } from "../../ast/filters/property-filters/ScoreFilter";
import type { FulltextOptions } from "../../ast/operations/FulltextOperation";
import { FulltextOperation } from "../../ast/operations/FulltextOperation";
import { FulltextSelection } from "../../ast/selection/FulltextSelection";
import type { QueryASTFactory } from "../QueryASTFactory";
import { findFieldsByNameInFieldsByTypeNameField } from "../parsers/find-fields-by-name-in-fields-by-type-name-field";
import { getFieldsByTypeName } from "../parsers/get-fields-by-type-name";

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
        const resolveTreeWhere: Record<string, any> =
            this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree) ?? {};

        checkEntityAuthentication({
            entity: entity.entity,
            targetOperations: ["READ"],
            context,
        });

        let scoreField: ScoreField | undefined;
        const fulltextConnectionFields = resolveTree.fieldsByTypeName[entity.operations.fulltextTypeNames.connection];

        if (!fulltextConnectionFields) {
            throw new Error("Fulltext result field not found");
        }

        const filteredResolveTreeEdges = findFieldsByNameInFieldsByTypeNameField(fulltextConnectionFields, "edges");
        const edgeFields = getFieldsByTypeName(filteredResolveTreeEdges, entity.operations.fulltextTypeNames.edge);
        const scoreFields = findFieldsByNameInFieldsByTypeNameField(edgeFields, "score");

        // We only care about the first score field
        if (scoreFields.length > 0 && scoreFields[0] && context.fulltext) {
            scoreField = new ScoreField({
                alias: scoreFields[0].alias,
                score: context.fulltext.scoreVariable,
            });
        }

        const operation = new FulltextOperation({
            target: entity,
            scoreField,
            selection: this.getFulltextSelection(entity, context),
        });

        const concreteEdgeFields = getFieldsByTypeName(
            filteredResolveTreeEdges,
            entity.operations.fulltextTypeNames.edge
        );

        this.addFulltextScoreFilter({
            operation,
            context,
            whereArgs: resolveTreeWhere,
        });

        this.queryASTFactory.operationsFactory.hydrateConnectionOperation({
            target: entity,
            resolveTree: resolveTree,
            context,
            operation,
            whereArgs: resolveTreeWhere,
            resolveTreeEdgeFields: concreteEdgeFields,
        });

        return operation;
    }

    private addFulltextScoreFilter({
        operation,
        whereArgs,
        context,
    }: {
        operation: FulltextOperation;
        whereArgs: Record<string, any>;
        context: Neo4jGraphQLTranslationContext;
    }): void {
        if (whereArgs.score && context?.fulltext) {
            const scoreFilter = new ScoreFilter({
                scoreVariable: context.fulltext.scoreVariable,
                min: whereArgs.score.min,
                max: whereArgs.score.max,
            });
            operation.addFilters(scoreFilter);
        }
    }

    public getFulltextSelection(
        entity: ConcreteEntityAdapter,
        context: Neo4jGraphQLTranslationContext
    ): FulltextSelection {
        const fulltextOptions = this.getFulltextOptions(context);
        return new FulltextSelection({
            target: entity,
            fulltextOptions,
            scoreVariable: fulltextOptions.score,
        });
    }

    private getFulltextOptions(context: Neo4jGraphQLTranslationContext): FulltextOptions {
        if (!context.fulltext) {
            throw new Error("Fulltext context is missing");
        }

        const phrase = context.resolveTree.args.phrase;
        if (!phrase || typeof phrase !== "string") {
            throw new Error("Invalid phrase");
        }

        return {
            index: context.fulltext.index,
            phrase,
            score: context.fulltext.scoreVariable,
        };
    }
}
