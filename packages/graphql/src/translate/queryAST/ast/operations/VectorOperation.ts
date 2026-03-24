/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { VectorField } from "../../../../schema-model/annotation/VectorAnnotation";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { ScoreField } from "../fields/ScoreField";
import type { EntitySelection } from "../selection/EntitySelection";
import { ScoreSort } from "../sort/ScoreSort";
import { ConnectionReadOperation } from "./ConnectionReadOperation";

export type VectorOptions = {
    index: VectorField;
    vector?: number[];
    phrase?: string;
    score: Cypher.Variable;
};

export class VectorOperation extends ConnectionReadOperation {
    private scoreField: ScoreField | undefined;

    constructor({
        target,
        relationship,
        scoreField,
        selection,
    }: {
        target: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
        scoreField: ScoreField | undefined;
        selection: EntitySelection;
    }) {
        super({
            target,
            relationship,
            selection,
        });

        this.scoreField = scoreField;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...super.getChildren(), this.scoreField]);
    }

    protected createProjectionMapForEdge(context: QueryASTContext<Cypher.Node>): Cypher.Map {
        const edgeProjectionMap = new Cypher.Map();

        edgeProjectionMap.set("node", this.createProjectionMapForNode(context));
        if (this.scoreField && context.neo4jGraphQLContext.vector) {
            edgeProjectionMap.set("score", context.neo4jGraphQLContext.vector.scoreVariable);
        }
        return edgeProjectionMap;
    }

    protected getUnwindClause(
        context: QueryASTContext<Cypher.Node>,
        edgeVar: Cypher.Variable,
        edgesVar: Cypher.Variable
    ): Cypher.With {
        if ((this.scoreField || this.hasScoreSort()) && context.neo4jGraphQLContext.vector) {
            // No relationship, so we directly unwind node and score
            return new Cypher.Unwind([edgesVar, edgeVar]).with(
                [edgeVar.property("node"), context.target],
                [edgeVar.property("score"), context.neo4jGraphQLContext.vector.scoreVariable]
            );
        } else {
            return super.getUnwindClause(context, edgeVar, edgesVar);
        }
    }

    protected getWithCollectEdgesAndTotalCount(
        nestedContext: QueryASTContext<Cypher.Node>,
        edgesVar: Cypher.Variable,
        totalCount: Cypher.Variable
    ): Cypher.With {
        if ((this.scoreField || this.hasScoreSort()) && nestedContext.neo4jGraphQLContext.vector) {
            const nodeAndRelationshipMap = new Cypher.Map({
                node: nestedContext.target,
            });

            if (nestedContext.relationship) {
                nodeAndRelationshipMap.set("relationship", nestedContext.relationship);
            }

            nodeAndRelationshipMap.set("score", nestedContext.neo4jGraphQLContext.vector.scoreVariable);

            return new Cypher.With([Cypher.collect(nodeAndRelationshipMap), edgesVar]).with(edgesVar, [
                Cypher.size(edgesVar),
                totalCount,
            ]);
        } else {
            return super.getWithCollectEdgesAndTotalCount(nestedContext, edgesVar, totalCount);
        }
    }

    private hasScoreSort(): boolean {
        return this.sortFields.some(({ node }) => node.some((sort) => sort instanceof ScoreSort));
    }
}
