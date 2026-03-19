/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { filterTruthy } from "../../../utils/utils";
import type { QueryASTContext } from "../ast/QueryASTContext";
import type { QueryASTNode } from "../ast/QueryASTNode";

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
