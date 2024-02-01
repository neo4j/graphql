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
import { mapLabelsWithContext } from "../../../../schema-model/utils/map-labels-with-context";
import { QueryASTContext } from "../QueryASTContext";
import type { FulltextOptions } from "../operations/FulltextOperation";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class FulltextSelection extends EntitySelection {
    private target: ConcreteEntityAdapter;
    private fulltext: FulltextOptions;

    private scoreVariable: Cypher.Variable;

    constructor({
        target,
        fulltext,
        scoreVariable,
    }: {
        target: ConcreteEntityAdapter;
        fulltext: FulltextOptions;
        scoreVariable: Cypher.Variable;
    }) {
        super();
        this.target = target;
        this.fulltext = fulltext;
        this.scoreVariable = scoreVariable;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const node = new Cypher.Node();
        const phraseParam = new Cypher.Param(this.fulltext.phrase);
        const indexName = new Cypher.Literal(this.fulltext.index);

        const fulltextClause: Cypher.Yield = Cypher.db.index.fulltext
            .queryNodes(indexName, phraseParam)
            .yield(["node", node], ["score", this.scoreVariable]);

        const expectedLabels = mapLabelsWithContext(this.target.getLabels(), context.neo4jGraphQLContext);

        const whereOperators = expectedLabels.map((label) => {
            return Cypher.in(new Cypher.Param(label), Cypher.labels(node));
        });

        fulltextClause.where(Cypher.and(...whereOperators));

        return {
            selection: fulltextClause,
            nestedContext: new QueryASTContext({
                target: node,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
                returnVariable: context.returnVariable,
                env: context.env,
                shouldCollect: context.shouldCollect,
            }),
        };
    }
}
