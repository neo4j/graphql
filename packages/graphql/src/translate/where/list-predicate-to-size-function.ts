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

import type { ListPredicate } from "./utils";

// TODO: Temporary function whilst filtering is performed in projections
// To be superseded by list-predicate-to-clause.ts when moved to subqueries
export function listPredicateToSizeFunction(listPredicate: ListPredicate, matchPattern: string, where: string): string {
    let clause: string;

    switch (listPredicate) {
        case "all":
            clause = `size([${matchPattern} WHERE NOT ${where} | 1]) = 0`;
            break;
        case "any":
            clause = `size([${matchPattern} WHERE ${where} | 1]) > 0`;
            break;
        case "none":
            clause = `size([${matchPattern} WHERE ${where} | 1]) = 0`;
            break;
        case "single":
            clause = `size([${matchPattern} WHERE ${where} | 1]) = 1`;
            break;
        default:
            throw new Error(`Unknown predicate ${listPredicate}`);
    }

    return clause;
}
