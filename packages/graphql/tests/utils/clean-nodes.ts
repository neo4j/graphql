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

import type { Result, Session } from "neo4j-driver";
import type { UniqueType } from "./graphql-types";
import { runCypher } from "./run-cypher";

/** Removes all nodes with the given labels from the database */
export async function cleanNodes(session: Session, labels: Array<string | UniqueType>): Promise<Result> {
    return runCypher(
        session,
        `MATCH(n) WHERE labels(n) IN [${labels.map((l) => `"${l}"`).join(",")}]
        DETACH DELETE n`
    );
}
