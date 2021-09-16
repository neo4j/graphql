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

import { Node } from "../classes";
import { RelationField, Context } from "../types";

// Do not try to use WITH to 'optimize' this function by calculating the `count()` and
// `avg()`... only once, it will break the flow of the query.
function createAggregateWhereAndParams({
    node,
    field,
    varName,
    chainStr,
    context,
    aggregation,
}: {
    node: Node;
    field: RelationField;
    varName: string;
    chainStr: string;
    context: Context;
    aggregation: any;
}): [string, any] {
    let cyphers: string[] = [];
    let params = {};

    const inStr = field.direction === "IN" ? "<-" : "-";
    const outStr = field.direction === "OUT" ? "->" : "-";
    const relTypeStr = `[:${field.type}]`;
    const nodeVariable = `${chainStr}_node`;
    const predicates: string[] = [];

    const matchStr = `MATCH (${varName})${inStr}${relTypeStr}${outStr}(${nodeVariable}:${field.typeMeta.name})`;
    cyphers.push(`apoc.cypher.runFirstColumn(\" ${matchStr}`);

    Object.entries(aggregation).forEach((entry) => {
        ["count", "count_LT", "count_LTE", "count_GT", "count_GTE"].forEach((countType) => {
            if (entry[0] === countType) {
                const paramName = `${chainStr}_${entry[0]}`;
                params[paramName] = entry[1];

                let operator = "=";

                switch (countType.split("_")[1]) {
                    case "LT":
                        operator = "<";
                        break;
                    case "LTE":
                        operator = "<=";
                        break;
                    case "GT":
                        operator = ">";
                        break;
                    case "GTE":
                        operator = ">=";
                        break;
                    default:
                        operator = "=";
                        break;
                }

                predicates.push(`count(${nodeVariable}) ${operator} $${paramName}`);
            }
        });
    });

    cyphers.push(`RETURN ${predicates.join(" AND ")}`);

    const apocParams = Object.keys(params).length
        ? `, ${Object.keys(params)
              .map((x) => `${x}: $${x}`)
              .join(", ")}`
        : "";

    cyphers.push(`", { this: ${varName}${apocParams} }, false )`);

    return [cyphers.join("\n"), params];
}

export default createAggregateWhereAndParams;
