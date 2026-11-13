/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DirectiveNode } from "graphql";
import { queryDirective } from "../../../graphql/directives";
import { QueryAnnotation } from "../../annotation/QueryAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseQueryAnnotation(directive: DirectiveNode): QueryAnnotation {
    const { read, aggregate, connection, groupBy } = parseArguments<{
        read: boolean;
        aggregate: boolean;
        connection: boolean;
        groupBy: boolean;
    }>(queryDirective, directive);

    return new QueryAnnotation({
        read,
        aggregate,
        connection,
        groupBy,
    });
}
