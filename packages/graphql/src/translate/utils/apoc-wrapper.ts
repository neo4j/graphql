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

export const apocWrapper = {
    validatePredicate(predicate: Cypher.Predicate, message: string): Cypher.Function {
        return new Cypher.Function("apoc.util.validatePredicate", [
            predicate,
            new Cypher.Literal(message),
            new Cypher.Literal([0]),
        ]);
    },
    validate(
        predicate: Cypher.Predicate,
        message: string,
        params: Cypher.List | Cypher.Literal | Cypher.Map = new Cypher.List([])
    ): Cypher.VoidProcedure {
        return new Cypher.VoidProcedure("apoc.util.validate", [predicate, new Cypher.Literal(message), params]);
    },
    convertFormat(temporalParam: Cypher.Expr, currentFormat: string, convertTo = "yyyy-MM-dd"): Cypher.Function {
        return new Cypher.Function("apoc.date.convertFormat", [
            Cypher.toString(temporalParam), // NOTE: should this be `toString` by default?
            new Cypher.Literal(currentFormat),
            new Cypher.Literal(convertTo),
        ]);
    },
};
