import Cypher from "@neo4j/cypher-builder";
import { groupBy, uniq, compact, zip } from "lodash";
import { UNION_UNIFICATION_ENABLED } from "../optimizationSettings";
import type { Neo4jGraphQLTranslationContext } from "../../../../../types/neo4j-graphql-translation-context";

function getMilliSeconds(hrTime: [number, number]) {
    return (hrTime[0] * 1000000 + hrTime[1] / 1000.0) / 1000.0;
}

interface UniqSubQueriesEntry<T> {
    child: T;
    unifyViaDataModelType?: string;
    exclusionPredicates?: (matchNode: Cypher.Node) => Cypher.Predicate[];
}

interface Target {
    name: string;
    getLabels: (...args: any[]) => string[];
}

//
// This eliminiates sub-queries if they are EXACTLY equal.
// Note that we recursively calling this function, so basically we repeatedly
// compact the tree right to left and then top to bottom.
// Furthermore after compaction we need to recompute with different selectors.
//
// This is obviously not very efficient - but it's easy and robust.
//
export function uniqSubQueries<T>(
    context: Neo4jGraphQLTranslationContext,
    matchUsingInterfaceOrUnion: string | undefined,
    children: T[],
    targetExtractor: (t: T) => Target,
    nestedSubqueriesProducer: (subs: UniqSubQueriesEntry<T>[]) => Cypher.Clause[][]
): Cypher.Clause[][] {
    if (!UNION_UNIFICATION_ENABLED || !matchUsingInterfaceOrUnion || children.length < 2) {
        return nestedSubqueriesProducer(children.map((c) => ({ child: c })));
    }

    const hrStart = process.hrtime();

    // TODO: This way of doing things is really slow! - around 50ms for a realistic query.
    //       It seems like the most expensive part is building the subquery twice!

    const nestedSubqueries = nestedSubqueriesProducer(
        children.map((c) => ({ child: c, unifyViaDataModelType: matchUsingInterfaceOrUnion }))
    );

    const nestedSubqueriesWithChildren = zip(nestedSubqueries, children);

    const groupedChildren = compact(
        uniq(
            Object.values(
                groupBy(nestedSubqueriesWithChildren, ([sqLst, child]) => {
                    if (!child) {
                        throw new Error("optimizer: child missing. should not happen.");
                    }
                    if (!sqLst) {
                        throw new Error("optimizer: sqLst missing. should not happen.");
                    }
                    return sqLst
                        .map((sq) => {
                            const { cypher, params } = sq.build();
                            // console.log(">>> hopefully similiar parts: ", cypher);
                            if (Object.keys(params).length > 0) {
                                return `${cypher}:${JSON.stringify(params)}`; // group by query.
                            }
                            return cypher; // group by query.
                        })
                        .join(";");
                })
            ).map((group) => compact(group.map((g) => g[1])))
        )
    );

    const { labelManager } = context;

    function computeExclusionLabels(groupedChildren: T[][], g: T[]): (Cypher.LabelExpr | string[])[] {
        const labels = groupedChildren
            .filter((cur) => cur !== g)
            .flatMap((cur) =>
                cur.map((it) => {
                    const target = targetExtractor(it);
                    console.log(">>> BUILDING exclusion label for " + target.name);
                    if (labelManager) {
                        return labelManager.getLabelSelectorExpressionObject(target.name);
                    }
                    return target.getLabels();
                })
            );
        return labels;
    }

    const res = groupedChildren.map((g) => ({
        child: g[0] as T,
        ...(g.length > 1
            ? ({
                  unifyViaDataModelType: matchUsingInterfaceOrUnion,
                  exclusionPredicates: (matchNode) => {
                      const exclusions = computeExclusionLabels(groupedChildren, g);
                      if (exclusions.length > 0) {
                          return [
                              Cypher.not(
                                  Cypher.or(
                                      ...exclusions.map((orGroup) => Cypher.and(matchNode.hasLabelsOf(orGroup, true)))
                                  )
                              ),
                          ];
                      }
                      return [];
                  },
              } satisfies Partial<UniqSubQueriesEntry<T>>)
            : {}),
    }));

    const time = getMilliSeconds(process.hrtime(hrStart));
    console.log(">>> optimization took (ms): ", time);

    return nestedSubqueriesProducer(res);
}
