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

// These are interfaces, mainly to avoid coupling and circular dependencies between context and statements

/** Represents a Cypher Variable Reference <https://neo4j.com/docs/cypher-manual/current/syntax/variables/> */
export interface CypherVariable {
    readonly prefix: string;
}


/** Represents a CypherParam */
export interface CypherParameter {
    readonly prefix: string;
    value: any;
}
