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

export function listPredicateToClause(listPredicate: ListPredicate, matchPattern: string, where: string): string {
    let clause: string;

    switch (listPredicate) {
        case "all":
            // This one is not as expressive as we would like
            // ALL == NOT ANY WHERE NOT
            clause = `NOT EXISTS { ${matchPattern} WHERE NOT ${where} }`;
            break;
        case "any":
            clause = `EXISTS { ${matchPattern} WHERE ${where} }`;
            break;
        case "none":
            clause = `NOT EXISTS { ${matchPattern} WHERE ${where} }`;
            break;
        case "single":
            // Sadly no expressive way to check for single match
            clause = `size([${matchPattern} WHERE ${where} | 1]) = 1`;
            break;
        default:
            throw new Error(`Unknown predicate ${listPredicate}`);
    }

    return clause;
}
