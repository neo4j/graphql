/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Debug from "debug";
import type { GraphQLResolveInfo } from "graphql";
import type { QueryResult, SessionMode } from "neo4j-driver";
import { DEBUG_EXECUTE } from "../constants";
import type { Neo4jGraphQLComposedContext } from "../schema/resolvers/composition/wrap-query-and-mutation";

const debug = Debug(DEBUG_EXECUTE);

interface ExecuteResult {
    result: QueryResult;
    statistics: Record<string, number>;
    records: Record<PropertyKey, any>[];
}

async function execute({
    cypher,
    params,
    defaultAccessMode,
    context,
    info,
}: {
    cypher: string;
    params: any;
    defaultAccessMode: SessionMode;
    context: Neo4jGraphQLComposedContext;
    info?: GraphQLResolveInfo;
}): Promise<ExecuteResult> {
    const result = await context.executor.execute(cypher, params, defaultAccessMode, info);

    if (!result) {
        throw new Error("Unable to execute query against Neo4j database");
    }

    const records = result.records.map((r) => r.toObject());

    debug(`Execute successful, received ${records.length} records`);

    return {
        result,
        statistics: result.summary.counters.updates(),
        records,
    };
}

export default execute;
