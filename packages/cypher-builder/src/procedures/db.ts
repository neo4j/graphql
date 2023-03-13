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

import { CypherProcedure } from "./CypherProcedure";
import type { Literal } from "../references/Literal";
import type { Param } from "../references/Param";
import type { Variable } from "../references/Variable";
import { normalizeVariable } from "../utils/normalize-variable";

type FulltextPhrase = string | Literal<string> | Param | Variable;

/**
 * @group procedures
 */
export const index = {
    fulltext: {
        queryNodes(indexName: string | Literal<string>, phrase: FulltextPhrase): CypherProcedure {
            const phraseVar = normalizeVariable(phrase);
            const indexNameVar = normalizeVariable(indexName);

            return new CypherProcedure("db.index.fulltext.queryNodes", [indexNameVar, phraseVar]);
        },
    },
};

/**
 * @group procedures
 */
export function labels(): CypherProcedure {
    return new CypherProcedure("db.labels");
}
