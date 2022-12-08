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

import Cypher from "@neo4j/cypher-builder";

/**
 * caseWhere is a function that take a predicate and a list of CypherVariable,
 * if the predicate is true then it return these, if the predicate instead is false then it returns these variables as null,
 * the output is the same to a WHERE predicate appended to the an OPTIONAL MATCH.
 * This is helpful when a Cypher block need to be put between an OPTIONAL MATCH and a WHERE.
 */

export function caseWhere(predicate: Cypher.Predicate, columns: Cypher.Variable[]): Cypher.Clause {
    const caseProjection = new Cypher.Variable();
    const nullList = new Cypher.List(Array(columns.length).fill(new Cypher.Literal(null)));
    const caseFilter = new Cypher.Case(predicate)
        .when(new Cypher.Literal(true))
        .then(new Cypher.List(columns))
        .else(nullList);
    const aggregationWith = new Cypher.With("*", [caseFilter, caseProjection]).distinct();
    const columnsProjection = Array(columns.length)
        .fill(() => undefined)
        .map((element, index) => [caseProjection.index(index), columns[index]] as [Cypher.Expr, Cypher.Variable]);
    const caseProjectionWith = new Cypher.With("*", ...columnsProjection);
    return Cypher.concat(aggregationWith, caseProjectionWith);
}
