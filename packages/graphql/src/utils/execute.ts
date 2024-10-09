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

import Debug from "debug";
import type { GraphQLResolveInfo } from "graphql";
import type { QueryResult, SessionMode } from "neo4j-driver";
import { DEBUG_EXECUTE } from "../constants";
import type { Neo4jGraphQLComposedContext } from "../schema/resolvers/composition/wrap-query-and-mutation";

const debug = Debug(DEBUG_EXECUTE);

export interface ExecuteResult {
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
