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
 * @see [Neo4j Documentation](https://neo4j.com/docs/operations-manual/5/reference/procedures/)
 * @group Expressions
 * @category Procedures
 */
export const index = {
    fulltext: {
        queryNodes(indexName: string | Literal<string>, phrase: FulltextPhrase): CypherProcedure<"node" | "score"> {
            // TODO: add options, skip limit, analyzer
            const phraseVar = normalizeVariable(phrase);
            const indexNameVar = normalizeVariable(indexName);

            return new CypherProcedure("db.index.fulltext.queryNodes", [indexNameVar, phraseVar]);
        },
    },
};

/** Returns all labels in database
 * @see [Neo4j Documentation](https://neo4j.com/docs/operations-manual/5/reference/procedures/#procedure_db_labels)
 * @group Expressions
 * @category Procedures
 */
export function labels(): CypherProcedure<"label"> {
    return new CypherProcedure("db.labels");
}
