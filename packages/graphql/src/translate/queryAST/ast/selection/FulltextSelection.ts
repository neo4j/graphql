/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { mapLabelsWithContext } from "../../../../schema-model/utils/map-labels-with-context";
import { QueryASTContext } from "../QueryASTContext";
import type { FulltextOptions } from "../operations/FulltextOperation";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class FulltextSelection extends EntitySelection {
    private target: ConcreteEntityAdapter;
    private fulltextOptions: FulltextOptions;

    private scoreVariable: Cypher.Variable;

    constructor({
        target,
        fulltextOptions,
        scoreVariable,
    }: {
        target: ConcreteEntityAdapter;
        fulltextOptions: FulltextOptions;
        scoreVariable: Cypher.Variable;
    }) {
        super();
        this.target = target;
        this.fulltextOptions = fulltextOptions;
        this.scoreVariable = scoreVariable;
    }
    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const node = new Cypher.Node();
        const phraseParam = new Cypher.Param(this.fulltextOptions.phrase);
        const indexName = new Cypher.Literal(this.fulltextOptions.index.indexName);

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
