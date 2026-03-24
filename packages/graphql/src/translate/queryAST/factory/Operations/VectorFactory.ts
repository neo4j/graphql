/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { ScoreField } from "../../ast/fields/ScoreField";
import { ScoreFilter } from "../../ast/filters/property-filters/ScoreFilter";
import type { VectorOptions } from "../../ast/operations/VectorOperation";
import { VectorOperation } from "../../ast/operations/VectorOperation";
import { VectorSelection } from "../../ast/selection/VectorSelection";
import type { QueryASTFactory } from "../QueryASTFactory";
import { findFieldsByNameInFieldsByTypeNameField } from "../parsers/find-fields-by-name-in-fields-by-type-name-field";
import { getFieldsByTypeName } from "../parsers/get-fields-by-type-name";

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
        const resolveTreeWhere: Record<string, any> =
            this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree) ?? {};

        checkEntityAuthentication({
            entity: entity.entity,
            targetOperations: ["READ"],
            context,
        });

        let scoreField: ScoreField | undefined;
        const vectorConnectionFields = resolveTree.fieldsByTypeName[entity.operations.vectorTypeNames.connection];

        if (!vectorConnectionFields) {
            throw new Error("Vector result field not found");
        }

        const filteredResolveTreeEdges = findFieldsByNameInFieldsByTypeNameField(vectorConnectionFields, "edges");
        const edgeFields = getFieldsByTypeName(filteredResolveTreeEdges, entity.operations.vectorTypeNames.edge);
        const scoreFields = findFieldsByNameInFieldsByTypeNameField(edgeFields, "score");

        // We only care about the first score field
        if (scoreFields.length > 0 && scoreFields[0] && context.vector) {
            scoreField = new ScoreField({
                alias: scoreFields[0].alias,
                score: context.vector.scoreVariable,
            });
        }

        const operation = new VectorOperation({
            target: entity,
            scoreField,
            selection: this.getVectorSelection(entity, context),
        });

        const concreteEdgeFields = getFieldsByTypeName(
            filteredResolveTreeEdges,
            entity.operations.vectorTypeNames.edge
        );

        this.addVectorScoreFilter({
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

    private addVectorScoreFilter({
        operation,
        whereArgs,
        context,
    }: {
        operation: VectorOperation;
        whereArgs: Record<string, any>;
        context: Neo4jGraphQLTranslationContext;
    }): void {
        if (whereArgs.score && context?.vector) {
            const scoreFilter = new ScoreFilter({
                scoreVariable: context.vector.scoreVariable,
                min: whereArgs.score.min,
                max: whereArgs.score.max,
            });
            operation.addFilters(scoreFilter);
        }
    }

    public getVectorSelection(entity: ConcreteEntityAdapter, context: Neo4jGraphQLTranslationContext): VectorSelection {
        const vectorOptions = this.getVectorOptions(context);
        return new VectorSelection({
            target: entity,
            vectorOptions,
            scoreVariable: vectorOptions.score,
            settings: context.vector?.vectorSettings,
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
    }
}
