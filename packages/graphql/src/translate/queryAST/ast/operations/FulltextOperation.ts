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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { mapLabelsWithContext } from "../../../../schema-model/utils/map-labels-with-context";
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { FulltextScoreField } from "../fields/FulltextScoreField";
import { ReadOperation } from "./ReadOperation";

export type FulltextOptions = {
    index: string;
    phrase: string;
    score?: Cypher.Variable;
};

export class FulltextOperation extends ReadOperation {
    private fulltext: FulltextOptions;

    private scoreField: FulltextScoreField | undefined;

    constructor({
        target,
        relationship,
        directed,
        fulltext,
        scoreField,
    }: {
        target: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
        directed?: boolean;
        fulltext: FulltextOptions;
        scoreField: FulltextScoreField | undefined;
    }) {
        super({
            target,
            directed,
            relationship,
        });

        this.fulltext = fulltext;
        this.scoreField = scoreField;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...super.getChildren(), this.scoreField]);
    }

    protected getSelectionClauses(
        context: QueryASTContext,
        node: Cypher.Node | Cypher.Pattern
    ): {
        preSelection: Array<Cypher.Match | Cypher.With | Cypher.Yield>;
        selectionClause: Cypher.Yield | Cypher.With;
    } {
        if (!this.nodeAlias) {
            throw new Error("Node alias missing on top level fulltext");
        }

        if (node instanceof Cypher.Pattern) {
            throw new Error("Nested not supported in aggregations");
        }

        const phraseParam = new Cypher.Param(this.fulltext.phrase);
        const indexName = new Cypher.Literal(this.fulltext.index);

        let fulltextClause: Cypher.Yield | Cypher.With = Cypher.db.index.fulltext
            .queryNodes(indexName, phraseParam)
            .yield(["node", node]);

        if (this.scoreField) {
            const scoreProjection = this.scoreField.getProjectionField(node);

            fulltextClause = Cypher.db.index.fulltext
                .queryNodes(indexName, phraseParam)
                .yield(["node", node], ["score", scoreProjection.score]);
        }

        const expectedLabels = mapLabelsWithContext(this.target.getLabels(), context.neo4jGraphQLContext);

        const whereOperators = expectedLabels.map((label) => {
            return Cypher.in(new Cypher.Param(label), Cypher.labels(node));
        });

        fulltextClause.where(Cypher.and(...whereOperators));

        let extraMatches: Array<Cypher.Match | Cypher.With | Cypher.Yield> = this.getChildren().flatMap((f) => {
            return f.getSelection(context);
        });

        if (extraMatches.length > 0) {
            extraMatches = [fulltextClause, ...extraMatches];
            fulltextClause = new Cypher.With("*");
        }

        return {
            preSelection: extraMatches,
            selectionClause: fulltextClause,
        };
    }

    protected getReturnStatement(context: QueryASTContext, returnVariable: Cypher.Variable): Cypher.Return {
        const returnClause = super.getReturnStatement(context, returnVariable);

        if (this.scoreField) {
            const scoreProjection = this.scoreField.getProjectionField(returnVariable);

            returnClause.addColumns([scoreProjection.score, "score"]);
        }

        return returnClause;
    }
}
