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

        const fulltextClause: Cypher.Yield | Cypher.With = Cypher.db.index.fulltext
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
