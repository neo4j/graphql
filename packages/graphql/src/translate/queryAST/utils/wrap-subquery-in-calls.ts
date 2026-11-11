/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { filterTruthy } from "../../../utils/utils";
import type { QueryASTContext } from "../ast/QueryASTContext";
import type { QueryASTNode } from "../ast/QueryASTNode";
import type { AuthorizationFilters } from "../ast/filters/authorization-filters/AuthorizationFilters";

/** Gets subqueries from fields and map these to Call statements with inner target */
export function wrapSubqueriesInCypherCalls(
    context: QueryASTContext,
    fields: QueryASTNode[],
    withArgs?: Cypher.Variable[]
): Cypher.Clause[] {
    return filterTruthy(
        fields.flatMap((f) => {
            return f.getSubqueries(context);
        })
    ).map((sq) => {
        return new Cypher.Call(sq, withArgs);
    });
}

/** Gets the BEFORE or AFTER subqueries from authorization filters and maps these to Call statements with the context target */
export function wrapAuthFiltersInCypherCalls(
    filters: AuthorizationFilters[],
    when: "BEFORE" | "AFTER",
    context: QueryASTContext<Cypher.Node>
): Cypher.Clause[] {
    return filters
        .flatMap((authFilter) => {
            if (when === "BEFORE") {
                return authFilter.getSubqueriesBefore(context);
            }

            return authFilter.getSubqueriesAfter(context);
        })
        .map((sq) => {
            return new Cypher.Call(sq, [context.target]);
        });
}
